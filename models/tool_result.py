from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any

@dataclass
class ToolResult:
    """Standardized Tool Execution Contract for JON AI Assistant."""
    success: bool
    tool_name: str
    action: str
    target: Optional[str] = None
    message: str = ""
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "tool_name": self.tool_name,
            "action": self.action,
            "target": self.target,
            "message": self.message,
            "error": self.error,
            "data": self.data or {}
        }

    def __str__(self) -> str:
        if self.success:
            return f"✓ Tool '{self.tool_name}': {self.message}"
        else:
            err_msg = f" (Error: {self.error})" if self.error else ""
            return f"✗ Tool '{self.tool_name}': {self.message}{err_msg}"
