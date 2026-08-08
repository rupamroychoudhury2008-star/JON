import re
import sys
from typing import Tuple, Dict, Any
from config.settings import settings

DESTRUCTIVE_COMMAND_PATTERNS = [
    r"\bdel\b", r"\bremove\b", r"\brmdir\b", r"\bformat\b",
    r"\brm\s+-rf\b", r"\bdrop\b", r"\bshutdown\b", r"\breboot\b",
    r"\btaskkill\b", r"\bkill\b", r"\bsystem32\b"
]

class GuardrailChecker:
    """Checks tool actions for high-risk / destructive execution."""

    @staticmethod
    def is_destructive(tool_name: str, args: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Returns (is_destructive, warning_reason).
        """
        if not settings.require_tool_confirmation:
            return False, ""

        if tool_name == "run_command":
            cmd = str(args.get("cmd", "")).lower()
            for pattern in DESTRUCTIVE_COMMAND_PATTERNS:
                if re.search(pattern, cmd):
                    return True, f"Shell command matches destructive pattern: '{pattern}'"

        if tool_name == "write_file":
            path = str(args.get("path", ""))
            # Overwriting system files
            if any(sys_path in path.lower() for sys_path in ["windows", "system32", "program files"]):
                return True, f"Attempting to write into system path: '{path}'"

        if tool_name == "close_app":
            app = str(args.get("name", "")).lower()
            if app in ["explorer", "explorer.exe", "system"]:
                return True, f"Attempting to kill core OS process: '{app}'"

        return False, ""

    @staticmethod
    def request_confirmation(warning_reason: str) -> bool:
        """Prompts user on CLI for confirmation if interactive tty, else safely blocks high-risk action without stalling HTTP server."""
        print(f"\n[GUARDRAIL WARNING]: {warning_reason}")
        if not sys.stdin.isatty():
            print("[GUARDRAIL]: Non-interactive session — safely blocking high-risk action.")
            return False
        try:
            user_input = input("Do you confirm executing this action? [y/N]: ").strip().lower()
            return user_input in ["y", "yes"]
        except (EOFError, RuntimeError, OSError):
            return False
