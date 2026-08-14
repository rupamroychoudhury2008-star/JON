import json
import time
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from config.settings import settings
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

class IntentRouter:
    def __init__(self):
        pass

    def route(self, request: UserRequest, force_offline: bool = False) -> IntentDecision:
        """
        Classifies request and routes 100% to high-performance Cloud API models (Groq / Nvidia NIM).
        """
        # Determine intent using fast rule-based classification
        intent = self._rule_based_classification(request.text)
        confidence = self._rule_confidence(request.text, intent)
        target_model = self._map_intent_to_model(intent)

        return IntentDecision(
            is_online=True,
            intent=intent,
            confidence=confidence,
            reasoning=f"Routed directly to Cloud API model ({target_model})",
            target_model=target_model
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

        # Coding keywords (check coding first so 'write a python script' maps to coding, not device_automation)
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

        # Device automation keywords
        automation_keywords = [
            r"\bopen\b", r"\bclose\b", r"\blaunch\b", r"\bstart\b", r"\bstop\b", r"\bkill\b",
            r"\bbrowser\b", r"\bclick\b", r"\bterminal\b", r"\bcmd\b", r"\bpowershell\b",
            r"\brun command\b", r"\bexecute\b", r"\bfile explorer\b",
            r"\bnotepad\b", r"\bcalculator\b", r"\bscreenshot\b", r"\bfolder\b",
            r"\bsearch in browser\b", r"\bgoogle search\b", r"\bwrite note\b", r"\bwrite file\b", r"\btypewrite\b",
            r"\bcall\b", r"\bdial\b", r"\bphone call\b", r"\bmake call\b", r"\bemail\b", r"\bgmail\b", r"\bsend email\b", r"\bcompose email\b"
        ]
        if any(re.search(p, lower_text) for p in automation_keywords):
            return "device_automation"

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
