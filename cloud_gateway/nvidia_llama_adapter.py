import time
import requests
from typing import Dict, Any, Optional
from config.settings import settings

class NvidiaLlamaAdapter:
    """Adapter for Nvidia NIM API - Llama 3.3 70B Instruct (Coding)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.nvidia_coding_api_key
        self.endpoint = "https://integrate.api.nvidia.com/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_nvidia_coding_api_key_here")

    def validate_key(self) -> Dict[str, Any]:
        """Tests if the configured Nvidia Coding API key is valid and active."""
        if not self.is_available():
            return {"valid": False, "status": "MISSING", "error": "API key not set in environment."}
        try:
            res = requests.post(
                self.endpoint,
                json={"model": settings.nvidia_coding_model, "messages": [{"role": "user", "content": "ping"}], "max_tokens": 1},
                headers={"Authorization": f"Bearer {self.api_key.strip()}", "Content-Type": "application/json"},
                timeout=5
            )
            if res.status_code == 200:
                return {"valid": True, "status": "VALID", "error": None}
            elif res.status_code == 401:
                return {"valid": False, "status": "INVALID_KEY (401)", "error": "401 Unauthorized: Invalid Nvidia Coding key."}
            elif res.status_code == 429:
                return {"valid": True, "status": "RATE_LIMITED (429)", "error": "429 Rate limited."}
            else:
                return {"valid": False, "status": f"HTTP {res.status_code}", "error": res.text[:200]}
        except Exception as e:
            return {"valid": False, "status": "ERROR", "error": str(e)}

    def code_task(self, prompt: str, system_prompt: Optional[str] = None, context: Optional[str] = None) -> str:
        if not self.is_available():
            raise ValueError("Nvidia Coding API key not configured.")

        messages = []
        sys_content = (
            "You are Jon, an expert software developer and coding assistant. "
            "Write clean, well-documented code. Include brief explanations of your approach. "
            "Use best practices and handle edge cases."
        )
        if context:
            sys_content += f"\n\nRelevant memory context:\n{context}"
        if system_prompt:
            sys_content += f"\n\n{system_prompt}"

        messages.append({"role": "system", "content": sys_content})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": settings.nvidia_coding_model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 4096
        }

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }

        try:
            start_time = time.time()
            res = requests.post(
                self.endpoint,
                json=payload,
                headers=headers,
                timeout=settings.nvidia_coding_timeout
            )
            elapsed = round(time.time() - start_time, 2)

            if res.status_code == 200:
                res_data = res.json()
                return res_data["choices"][0]["message"]["content"].strip()
            elif res.status_code == 401:
                raise RuntimeError("Nvidia Coding API authentication failed (401). Check your NVIDIA_CODING_API_KEY.")
            elif res.status_code == 429:
                raise RuntimeError("Nvidia Coding API rate limited (429). Try again shortly.")
            else:
                raise RuntimeError(f"Nvidia Llama API Error ({res.status_code}): {res.text[:300]}")
        except requests.exceptions.Timeout:
            raise RuntimeError(f"Nvidia Coding request timed out ({settings.nvidia_coding_timeout}s)")
        except requests.exceptions.ConnectionError:
            raise RuntimeError("Connection error reaching Nvidia NIM API")
        except RuntimeError:
            raise
        except Exception as e:
            raise RuntimeError(f"Nvidia Llama request failed: {str(e)}")
