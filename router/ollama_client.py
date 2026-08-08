import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from config.settings import settings

class OllamaClient:
    """Client for interacting with local Ollama daemon."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")

    def health_check(self) -> Dict[str, Any]:
        """Check if Ollama service is running and list available models."""
        url = f"{self.base_url}/api/tags"
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    models = [m.get("name") for m in data.get("models", [])]
                    return {
                        "status": "healthy",
                        "available_models": models,
                        "router_model_available": any(settings.router_model in m for m in models),
                        "offline_model_available": any(settings.offline_model in m for m in models)
                    }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
        return {"status": "unhealthy", "error": "Unknown error"}

    def generate(self, model: str, prompt: str, system: Optional[str] = None, json_mode: bool = False, temperature: float = 0.2) -> str:
        """Call Ollama /api/generate endpoint with extended local model loading timeout."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature}
        }
        if system:
            payload["system"] = system
        if json_mode:
            payload["format"] = "json"

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")

        # Use 120s timeout to allow large models (llama3.1:8b) to load into GPU/VRAM
        timeout_val = max(getattr(settings, "ollama_timeout", 60), 120)

        try:
            with urllib.request.urlopen(req, timeout=timeout_val) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                return res_body.get("response", "").strip()
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8") if e.fp else str(e)
            raise RuntimeError(f"Ollama API HTTP error {e.code}: {err_msg}")
        except Exception as e:
            raise RuntimeError(f"Ollama request failed: {e}")
