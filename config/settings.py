import os
from pathlib import Path
import yaml
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load .env file if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

CONFIG_YAML_PATH = Path(__file__).resolve().parent / "config.yaml"

class Settings:
    def __init__(self, config_path: Path = CONFIG_YAML_PATH):
        self.config_data: Dict[str, Any] = {}
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                self.config_data = yaml.safe_load(f) or {}

        # System
        sys_cfg = self.config_data.get("system", {})
        self.assistant_name: str = sys_cfg.get("name", "Jon")
        self.wake_words: List[str] = sys_cfg.get("wake_words", ["jon", "hey jon"])
        vault_str = os.getenv("OBSIDIAN_VAULT_PATH", sys_cfg.get("vault_path", "d:/JON/vault"))
        self.vault_path: Path = Path(vault_str).resolve()
        self.require_tool_confirmation: bool = os.getenv("REQUIRE_TOOL_CONFIRMATION", str(sys_cfg.get("require_confirmation", True))).lower() == "true"

        # Ollama
        ollama_cfg = self.config_data.get("ollama", {})
        self.ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", ollama_cfg.get("base_url", "http://127.0.0.1:11434"))
        self.router_model: str = os.getenv("ROUTER_MODEL", ollama_cfg.get("router_model", "llama3.2:3b"))
        self.offline_model: str = os.getenv("OFFLINE_MODEL", ollama_cfg.get("offline_model", "llama3.1:8b"))
        self.ollama_timeout: int = ollama_cfg.get("timeout_seconds", 60)

        # Network
        net_cfg = self.config_data.get("network", {})
        self.network_hosts: List[str] = net_cfg.get("check_hosts", ["http://1.1.1.1", "https://www.google.com"])
        self.network_timeout: float = float(net_cfg.get("timeout_seconds", 2.0))

        # Cloud API Keys & Models
        self.groq_api_key: str = os.getenv("GROQ_API_KEY", "")
        self.nvidia_coding_api_key: str = os.getenv("NVIDIA_CODING_API_KEY", "")
        self.nvidia_automation_api_key: str = os.getenv("NVIDIA_AUTOMATION_API_KEY", "")
        
        cloud_cfg = self.config_data.get("cloud_models", {})
        self.groq_model: str = cloud_cfg.get("groq", {}).get("model", "llama-3.3-70b-versatile")
        self.groq_timeout: int = cloud_cfg.get("groq", {}).get("timeout_seconds", 30)
        self.nvidia_coding_model: str = cloud_cfg.get("nvidia_coding", {}).get("model", "meta/llama-3.3-70b-instruct")
        self.nvidia_coding_timeout: int = cloud_cfg.get("nvidia_coding", {}).get("timeout_seconds", 45)
        self.nvidia_automation_model: str = cloud_cfg.get("nvidia_automation", {}).get("model", "nvidia/llama-3.1-nemotron-70b-instruct")
        self.nvidia_automation_timeout: int = cloud_cfg.get("nvidia_automation", {}).get("timeout_seconds", 60)
        self.nvidia_automation_fallback_models: List[str] = cloud_cfg.get("nvidia_automation", {}).get("fallback_models", [
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "nvidia/nemotron-4-340b-instruct"
        ])

        # Obsidian REST API
        self.obsidian_rest_url: str = os.getenv("OBSIDIAN_REST_API_URL", "http://127.0.0.1:27124")
        self.obsidian_rest_key: str = os.getenv("OBSIDIAN_REST_API_KEY", "")

        # Server
        server_cfg = self.config_data.get("server", {})
        self.server_host: str = server_cfg.get("host", "0.0.0.0")
        self.server_port: int = server_cfg.get("port", 8000)
        self.static_dir: str = server_cfg.get("static_dir", "static")

        # IO
        io_cfg = self.config_data.get("io", {})
        self.default_input_source: str = os.getenv("DEFAULT_INPUT_SOURCE", io_cfg.get("default_input", "text"))
        self.default_output_mode: str = os.getenv("DEFAULT_OUTPUT_MODE", io_cfg.get("default_output", "text"))
        self.tts_rate: int = io_cfg.get("tts_rate", 180)
        self.stt_timeout: int = int(os.getenv("STT_TIMEOUT", io_cfg.get("stt_timeout", 15)))
        self.stt_phrase_time_limit: int = int(os.getenv("STT_PHRASE_TIME_LIMIT", io_cfg.get("stt_phrase_time_limit", 30)))
        self.stt_pause_threshold: float = float(os.getenv("STT_PAUSE_THRESHOLD", io_cfg.get("stt_pause_threshold", 2.0)))

settings = Settings()
