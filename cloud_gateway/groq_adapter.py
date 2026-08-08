import time
import requests
from typing import Dict, Any, Optional
from config.settings import settings

class GroqAdapter:
    """Adapter for Groq API (Chat / Research / Planning)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.groq_api_key
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_groq_api_key_here")

    def validate_key(self) -> Dict[str, Any]:
        """Tests if the configured Groq API key is valid and active."""
        if not self.is_available():
            return {"valid": False, "status": "MISSING", "error": "API key not set in environment."}
        try:
            res = requests.post(
                self.endpoint,
                json={"model": settings.groq_model, "messages": [{"role": "user", "content": "ping"}], "max_tokens": 1},
                headers={"Authorization": f"Bearer {self.api_key.strip()}", "Content-Type": "application/json"},
                timeout=5
            )
            if res.status_code == 200:
                return {"valid": True, "status": "VALID", "error": None}
            elif res.status_code == 401:
                return {"valid": False, "status": "INVALID_KEY (401)", "error": "401 Unauthorized: Invalid API key."}
            elif res.status_code == 429:
                return {"valid": True, "status": "RATE_LIMITED (429)", "error": "429 Rate limited."}
            else:
                return {"valid": False, "status": f"HTTP {res.status_code}", "error": res.text[:200]}
        except Exception as e:
            return {"valid": False, "status": "ERROR", "error": str(e)}

    def chat(self, prompt: str, system_prompt: Optional[str] = None, context: Optional[str] = None, max_retries: int = 2) -> str:
        if not self.is_available():
            raise ValueError("Groq API key not configured.")

        messages = []
        sys_content = "You are Jon, a helpful AI assistant. Be concise, accurate, and helpful."
        if context:
            sys_content += f"\n\nRelevant memory context:\n{context}"
        if system_prompt:
            sys_content += f"\n\n{system_prompt}"

        messages.append({"role": "system", "content": sys_content})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": settings.groq_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2048
        }

        headers = {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }

        last_error = None
        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()
                res = requests.post(
                    self.endpoint,
                    json=payload,
                    headers=headers,
                    timeout=settings.groq_timeout
                )
                elapsed = round(time.time() - start_time, 2)

                if res.status_code == 200:
                    res_data = res.json()
                    return res_data["choices"][0]["message"]["content"].strip()
                elif res.status_code == 429:
                    # Rate limited — wait and retry
                    wait_time = min(2 ** attempt, 8)
                    last_error = f"Groq rate limited (429), retrying in {wait_time}s..."
                    time.sleep(wait_time)
                    continue
                elif res.status_code == 401:
                    raise RuntimeError("Groq API authentication failed (401). Check your GROQ_API_KEY.")
                else:
                    raise RuntimeError(f"Groq API Error ({res.status_code}): {res.text[:300]}")
            except requests.exceptions.Timeout:
                last_error = f"Groq request timed out ({settings.groq_timeout}s)"
                continue
            except requests.exceptions.ConnectionError:
                last_error = "Connection error reaching Groq API"
                continue
            except RuntimeError:
                raise
            except Exception as e:
                last_error = str(e)
                continue

        raise RuntimeError(f"Groq request failed after {max_retries + 1} attempts. Last error: {last_error}")
