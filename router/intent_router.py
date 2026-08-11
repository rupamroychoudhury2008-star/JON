import json
import time
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from config.settings import settings
from .network_detector import is_network_available
from .ollama_client import OllamaClient

class UserRequest(BaseModel):
    text: str
    timestamp: float = Field(default_factory=time.time)
    source: str = "text"  # "voice" or "text"
    session_id: str = "default_session"

class IntentDecision(BaseModel):
    is_online: bool
    intent: str  # "chat/research/planning", "coding", "device_automation"
    confidence: float = 1.0
    reasoning: str = ""
    target_model: str = ""

SYSTEM_ROUTER_PROMPT = """You are the Intent Router for Jon, an AI assistant.
Your ONLY job is to classify user requests into one of three specific intents:

1. "chat/research/planning": General conversation, Q&A, research synthesis, brainstorming, advice, summarization, explanations, opinions, recommendations.
2. "coding": Code generation, code review, debugging, writing scripts, software design questions, programming language questions, API usage, algorithms.
3. "device_automation": Controlling the computer, opening/closing applications, reading/writing local files, browser automation, terminal commands, running shell scripts, system operations, screenshots.

You MUST respond strictly with a single valid JSON object in this exact format:
{
  "intent": "chat/research/planning" | "coding" | "device_automation",
  "reasoning": "short explanation"
}

Do NOT attempt to answer the user's request. Only output the classification JSON.
"""

class IntentRouter:
    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.ollama = ollama_client or OllamaClient()

    def route(self, request: UserRequest, force_offline: bool = False) -> IntentDecision:
        """
        Classifies request and determines routing.
        If network is offline or force_offline is True, returns offline decision.
        Otherwise uses Ollama 3B to classify the intent.
        """
        online_status = False if force_offline else is_network_available()

        if not online_status:
            return IntentDecision(
                is_online=False,
                intent="offline_fallback",
                confidence=1.0,
                reasoning="Network unreachable or offline mode enforced.",
                target_model=settings.offline_model
            )

        # Try rule-based first for obvious patterns (fast path)
        rule_intent = self._rule_based_classification(request.text)
        rule_confidence = self._rule_confidence(request.text, rule_intent)

        # If rule-based is very confident, skip LLM call (saves latency)
        if rule_confidence >= 0.95:
            return IntentDecision(
                is_online=True,
                intent=rule_intent,
                confidence=rule_confidence,
                reasoning=f"High-confidence rule-based classification",
                target_model=self._map_intent_to_model(rule_intent)
            )

        # Call Ollama 3B to classify online intent
        prompt = f"User Request: {request.text}"
        try:
            raw_response = self.ollama.generate(
                model=settings.router_model,
                prompt=prompt,
                system=SYSTEM_ROUTER_PROMPT,
                json_mode=True,
                temperature=0.1
            )
            
            parsed = json.loads(raw_response)
            intent = parsed.get("intent", "chat/research/planning")
            reasoning = parsed.get("reasoning", "")

            valid_intents = ["chat/research/planning", "coding", "device_automation"]
            if intent not in valid_intents:
                # Use rule-based fallback
                intent = rule_intent

            target_model = self._map_intent_to_model(intent)

            return IntentDecision(
                is_online=True,
                intent=intent,
                confidence=0.9,
                reasoning=reasoning,
                target_model=target_model
            )

        except Exception as e:
            # Fallback to rule-based classification if router call fails
            return IntentDecision(
                is_online=True,
                intent=rule_intent,
                confidence=rule_confidence,
                reasoning=f"Ollama router fallback ({str(e)})",
                target_model=self._map_intent_to_model(rule_intent)
            )

    def _map_intent_to_model(self, intent: str) -> str:
        if intent == "coding":
            return settings.nvidia_coding_model
        elif intent == "device_automation":
            return settings.nvidia_automation_model
        else:
            return settings.groq_model

    def _rule_based_classification(self, text: str) -> str:
        import re
        lower_text = text.lower()

        # Device automation keywords
        automation_keywords = [
            r"\bopen\b", r"\bclose\b", r"\blaunch\b", r"\bstart\b", r"\bstop\b", r"\bkill\b",
            r"\bbrowser\b", r"\bclick\b", r"\bterminal\b", r"\bcmd\b", r"\bpowershell\b",
            r"\brun command\b", r"\bexecute\b", r"\bfile explorer\b",
            r"\bnotepad\b", r"\bcalculator\b", r"\bscreenshot\b", r"\bfolder\b",
            r"\bsearch in browser\b", r"\bgoogle search\b", r"\bwrite\b", r"\btype\b", r"\btypewrite\b"
        ]
        if any(re.search(p, lower_text) for p in automation_keywords):
            return "device_automation"

        # Coding keywords
        coding_keywords = [
            r"\bcode\b", r"\bfunction\b", r"\bbug\b", r"\bpython\b", r"\bscript\b", r"\brefactor\b",
            r"\bjavascript\b", r"\bjava\b", r"\bclass\b", r"\bdef\b", r"\bimport\b",
            r"\bapi\b", r"\balgorithm\b", r"\bdebug\b", r"\bcompile\b", r"\bsyntax\b",
            r"\bhtml\b", r"\bcss\b", r"\breact\b", r"\bgit\b", r"\bcommit\b",
            r"write a program", r"write code", r"fix the code",
            r"\bdatabase\b", r"\bsql\b", r"\bquery\b", r"\bdeploy\b"
        ]
        if any(re.search(p, lower_text) for p in coding_keywords):
            return "coding"

        return "chat/research/planning"

    def _rule_confidence(self, text: str, intent: str) -> float:
        """Returns confidence level for rule-based classification."""
        lower = text.lower()
        
        if intent == "device_automation":
            # Very high confidence patterns
            strong_patterns = ["open ", "close ", "launch ", "run command ", "open app ", "write ", "type "]
            if any(lower.startswith(p) for p in strong_patterns) or " inside " in lower or " in notepad" in lower:
                return 0.98
            return 0.85

        if intent == "coding":
            strong_patterns = ["write a function", "write code", "debug", "fix the code",
                             "write a python", "write a script", "code review"]
            if any(p in lower for p in strong_patterns):
                return 0.95
            return 0.80

        # chat/research/planning is the default
        return 0.70
