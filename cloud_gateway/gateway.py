from typing import Dict, Any, Optional, List
from router.intent_router import UserRequest
from .groq_adapter import GroqAdapter
from .nvidia_llama_adapter import NvidiaLlamaAdapter
from .nvidia_nemotron_adapter import NvidiaNemotronAdapter

class CloudGateway:
    """Unified Cloud LLM Gateway dispatches requests to Groq or Nvidia NIM models based on intent."""

    def __init__(self):
        self.groq = GroqAdapter()
        self.nvidia_llama = NvidiaLlamaAdapter()
        self.nvidia_nemotron = NvidiaNemotronAdapter()

    def route_to_cloud(self, intent: str, request: UserRequest, context: Optional[str] = None, tools_schema: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Dispatches request to appropriate cloud provider based on intent.
        Returns unified dict response: {"provider": str, "content": str, "tool_calls": Optional[List]}
        """
        prompt = request.text

        # Intent: coding -> Nvidia Llama 3.3 70B Instruct (fallback to Groq 70B)
        if intent == "coding":
            coding_sys = "You are Jon, an expert software developer and coding assistant. Write clean, production-ready code with explanations."
            if self.nvidia_llama.is_available():
                try:
                    content = self.nvidia_llama.code_task(prompt=prompt, system_prompt=coding_sys, context=context)
                    return {"provider": "nvidia_llama_3.3_70b", "content": content, "tool_calls": None}
                except Exception as e:
                    if self.groq.is_available():
                        content = self.groq.chat(prompt=prompt, system_prompt=coding_sys, context=context)
                        return {"provider": f"groq_fallback (Nvidia Coding Error: {str(e)})", "content": content, "tool_calls": None}
                    raise e
            elif self.groq.is_available():
                content = self.groq.chat(prompt=prompt, system_prompt=coding_sys, context=context)
                return {"provider": "groq_fallback", "content": content, "tool_calls": None}

        # Intent: device_automation -> Nvidia Nemotron Ultra 550B (fallback to Groq 70B)
        elif intent == "device_automation":
            auto_sys = (
                "You are Jon, an autonomous AI assistant operating directly on the user's Windows PC. "
                "Acknowledge the user's command concisely. Direct execution tools will perform the action."
            )
            if self.nvidia_nemotron.is_available():
                try:
                    res = self.nvidia_nemotron.automate_task(prompt=prompt, tools_schema=tools_schema, context=context)
                    return {
                        "provider": "nvidia_nemotron_ultra_550b",
                        "content": res.get("content"),
                        "tool_calls": res.get("tool_calls")
                    }
                except Exception as e:
                    if self.groq.is_available():
                        content = self.groq.chat(prompt=prompt, system_prompt=auto_sys, context=context)
                        return {"provider": f"groq_fallback (Nvidia Nemotron Error: {str(e)})", "content": content, "tool_calls": None}
                    raise e
            elif self.groq.is_available():
                content = self.groq.chat(prompt=prompt, system_prompt=auto_sys, context=context)
                return {"provider": "groq_fallback", "content": content, "tool_calls": None}

        # Intent: chat/research/planning (or general default) -> Groq
        if self.groq.is_available():
            content = self.groq.chat(prompt=prompt, context=context)
            return {"provider": "groq", "content": content, "tool_calls": None}
        elif self.nvidia_llama.is_available():
            content = self.nvidia_llama.code_task(prompt=prompt, context=context)
            return {"provider": "nvidia_llama_fallback", "content": content, "tool_calls": None}

        raise RuntimeError("No Cloud API keys configured (GROQ_API_KEY / NVIDIA_CODING_API_KEY / NVIDIA_AUTOMATION_API_KEY missing).")

def routeToCloud(intent: str, request: UserRequest, context: Optional[str] = None, tools_schema: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    gateway = CloudGateway()
    return gateway.route_to_cloud(intent, request, context, tools_schema)
