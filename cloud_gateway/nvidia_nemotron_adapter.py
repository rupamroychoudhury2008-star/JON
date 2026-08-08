import time
import requests
from typing import Dict, Any, Optional, List
from config.settings import settings

class NvidiaNemotronAdapter:
    """Adapter for Nvidia NIM - Nemotron / Llama Nemotron (Full tool-use / device automation)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.nvidia_automation_api_key
        self.endpoint = "https://integrate.api.nvidia.com/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_nvidia_automation_api_key_here")

    def validate_key(self) -> Dict[str, Any]:
        """Tests if the configured Nvidia Automation API key is valid and active."""
        if not self.is_available():
            return {"valid": False, "status": "MISSING", "error": "API key not set in environment."}
        try:
            res = requests.post(
                self.endpoint,
                json={"model": settings.nvidia_automation_model, "messages": [{"role": "user", "content": "ping"}], "max_tokens": 1},
                headers={"Authorization": f"Bearer {self.api_key.strip()}", "Content-Type": "application/json"},
                timeout=5
            )
            if res.status_code == 200:
                return {"valid": True, "status": "VALID", "error": None}
            elif res.status_code == 401:
                return {"valid": False, "status": "INVALID_KEY (401)", "error": "401 Unauthorized: Invalid Nvidia Automation key."}
            elif res.status_code == 429:
                return {"valid": True, "status": "RATE_LIMITED (429)", "error": "429 Rate limited."}
            else:
                return {"valid": False, "status": f"HTTP {res.status_code}", "error": res.text[:200]}
        except Exception as e:
            return {"valid": False, "status": "ERROR", "error": str(e)}

    def automate_task(self, prompt: str, tools_schema: Optional[List[Dict[str, Any]]] = None, context: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_available():
            raise ValueError("Nvidia Automation API key not configured.")

        sys_content = (
            "You are Jon, an autonomous device automation agent running directly on the user's Windows PC. "
            "You have FULL CAPABILITY and DIRECT ACCESS to control the computer through tool function calls (open/close apps, read/write files, execute terminal commands, web browser automation). "
            "IMPORTANT: Never state that you cannot interact with the computer or provide manual step-by-step user instructions when a tool function exists for the task. "
            "Call the tool function directly to execute the requested action."
        )
        if context:
            sys_content += f"\n\nRelevant memory context:\n{context}"

        messages = [
            {"role": "system", "content": sys_content},
            {"role": "user", "content": prompt}
        ]

        payload: Dict[str, Any] = {
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 1024
        }

        if tools_schema:
            payload["tools"] = tools_schema
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }

        # Build model fallback list: primary model + configured fallbacks
        models_to_try = [settings.nvidia_automation_model]
        for fb in settings.nvidia_automation_fallback_models:
            if fb not in models_to_try:
                models_to_try.append(fb)

        last_error = None
        for model_name in models_to_try:
            payload["model"] = model_name
            try:
                start_time = time.time()
                res = requests.post(
                    self.endpoint,
                    json=payload,
                    headers=headers,
                    timeout=settings.nvidia_automation_timeout
                )
                elapsed = round(time.time() - start_time, 2)

                if res.status_code == 200:
                    res_data = res.json()
                    choice = res_data["choices"][0]["message"]
                    if "tool_calls" in choice and choice["tool_calls"]:
                        return {
                            "type": "tool_calls",
                            "tool_calls": choice["tool_calls"],
                            "content": choice.get("content"),
                            "model_used": model_name,
                            "latency_seconds": elapsed
                        }
                    else:
                        return {
                            "type": "content",
                            "content": choice.get("content", "").strip(),
                            "model_used": model_name,
                            "latency_seconds": elapsed
                        }
                elif res.status_code == 404:
                    last_error = f"Model {model_name} not found (404)"
                    continue
                elif res.status_code == 429:
                    last_error = f"Rate limited on model {model_name}"
                    time.sleep(1)
                    continue
                elif res.status_code == 401:
                    raise RuntimeError(f"Nvidia API authentication failed (401). Check your NVIDIA_AUTOMATION_API_KEY.")
                else:
                    error_body = res.text[:300]
                    last_error = f"Nvidia API Error ({res.status_code}) on {model_name}: {error_body}"
                    continue
            except requests.exceptions.Timeout:
                last_error = f"Timeout ({settings.nvidia_automation_timeout}s) on model {model_name}"
                continue
            except requests.exceptions.ConnectionError:
                last_error = f"Connection error reaching Nvidia NIM API for {model_name}"
                continue
            except RuntimeError:
                raise
            except Exception as e:
                last_error = f"{model_name}: {str(e)}"
                continue

        raise RuntimeError(f"All Nvidia automation models failed. Last error: {last_error}")
