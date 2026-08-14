import json
from typing import Dict, Any, List, Optional
from memory.obsidian_vault import ObsidianVault
from .app_tools import open_app, close_app, type_text
from .file_tools import read_file, write_file
from .browser_tools import open_browser, browser_action
from .terminal_tools import open_terminal, run_command, close_terminal
from .communication_tools import make_phone_call, compose_gmail
from .guardrails import GuardrailChecker

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "open_app",
            "description": "Opens an application on the computer",
            "parameters": {
                "type": "object",
                "properties": {"name": {"type": "string", "description": "Name of app e.g. notepad, chrome, calc"}},
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "type_text",
            "description": "Types specified text into a targeted application (e.g. notepad, word, chrome) or active window",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "Text to write or type into application"},
                    "app_name": {"type": "string", "description": "Optional name of app e.g. notepad, word, chrome"}
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "close_app",
            "description": "Closes a running application",
            "parameters": {
                "type": "object",
                "properties": {"name": {"type": "string", "description": "Name of app to close e.g. notepad.exe"}},
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Reads text content from a file path",
            "parameters": {
                "type": "object",
                "properties": {"path": {"type": "string", "description": "Absolute or relative file path"}},
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Writes text content to a file path",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Destination file path"},
                    "content": {"type": "string", "description": "Text content to write"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_browser",
            "description": "Opens a web browser to a given URL",
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string", "description": "URL to navigate to"}},
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "browser_action",
            "description": "Performs actions in browser via Playwright",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {"type": "string", "description": "navigate | click | type | text"},
                    "selector": {"type": "string", "description": "CSS selector or URL"},
                    "value": {"type": "string", "description": "Text value to type"}
                },
                "required": ["action"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "open_terminal",
            "description": "Opens a new terminal window",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "run_command",
            "description": "Executes a shell command on terminal",
            "parameters": {
                "type": "object",
                "properties": {"cmd": {"type": "string", "description": "Shell command to run"}},
                "required": ["cmd"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "close_terminal",
            "description": "Closes active terminal process",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "make_phone_call",
            "description": "Places or dials a phone call to a recipient phone number or contact via Windows Phone Link / Dialer",
            "parameters": {
                "type": "object",
                "properties": {
                    "phone_number": {"type": "string", "description": "Destination phone number to dial e.g. +1234567890"},
                    "contact_name": {"type": "string", "description": "Optional contact name e.g. John Doe"}
                },
                "required": ["phone_number"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compose_gmail",
            "description": "Composes and opens an email directly in Gmail browser window with recipient, subject, and body pre-filled",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {"type": "string", "description": "Recipient email address e.g. user@example.com"},
                    "subject": {"type": "string", "description": "Email subject line"},
                    "body": {"type": "string", "description": "Email body content"}
                },
                "required": ["to"]
            }
        }
    }
]

from models.tool_result import ToolResult

class ToolExecutor:
    """Dispatches tool execution, enforces guardrails, and logs to Obsidian."""

    def __init__(self, vault: Optional[ObsidianVault] = None):
        self.vault = vault or ObsidianVault()
        self.guardrail = GuardrailChecker()

    def execute_tool(self, tool_name: str, args: Dict[str, Any], session_id: str = "default_session", interactive: bool = True) -> ToolResult:
        """Executes named tool with arguments, enforcing guardrails and returning standardized ToolResult."""
        # 1. Guardrail check
        is_destr, reason = self.guardrail.is_destructive(tool_name, args)
        if is_destr:
            if interactive:
                confirmed = self.guardrail.request_confirmation(reason)
                if not confirmed:
                    res = ToolResult(success=False, tool_name=tool_name, action="guardrail", target=str(args.get("name") or args.get("cmd") or ""), message="Execution blocked by user guardrail.", error=reason)
                    self.vault.log_tool_call(tool_name, args, str(res), session_id)
                    return res
            else:
                res = ToolResult(success=False, tool_name=tool_name, action="guardrail", target=str(args.get("name") or args.get("cmd") or ""), message="Execution blocked by non-interactive guardrail policy.", error=reason)
                self.vault.log_tool_call(tool_name, args, str(res), session_id)
                return res

        # 2. Dispatch
        res: ToolResult
        try:
            if tool_name == "open_app":
                res = open_app(name=args.get("name", ""))
            elif tool_name == "type_text":
                res = type_text(text=args.get("text", ""), app_name=args.get("app_name"))
            elif tool_name == "close_app":
                res = close_app(name=args.get("name", ""))
            elif tool_name == "read_file":
                res = read_file(path=args.get("path", ""))
            elif tool_name == "write_file":
                res = write_file(path=args.get("path", ""), content=args.get("content", ""))
            elif tool_name == "open_browser":
                res = open_browser(url=args.get("url", ""))
            elif tool_name == "browser_action":
                res = browser_action(
                    action=args.get("action", ""),
                    selector=args.get("selector"),
                    value=args.get("value")
                )
            elif tool_name == "open_terminal":
                res = open_terminal()
            elif tool_name == "run_command":
                res = run_command(cmd=args.get("cmd", ""))
            elif tool_name == "close_terminal":
                res = close_terminal()
            elif tool_name == "make_phone_call" or tool_name == "place_call":
                res = make_phone_call(phone_number=args.get("phone_number", ""), contact_name=args.get("contact_name"))
            elif tool_name == "compose_gmail" or tool_name == "send_email_gmail":
                res = compose_gmail(to=args.get("to", ""), subject=args.get("subject", ""), body=args.get("body", ""))
            else:
                res = ToolResult(success=False, tool_name=tool_name, action="unknown", message=f"Unknown tool '{tool_name}'", error=f"Tool '{tool_name}' is not registered.")
        except Exception as e:
            res = ToolResult(success=False, tool_name=tool_name, action="execute", message=f"Tool execution exception for '{tool_name}'.", error=str(e))

        # 3. Log into Obsidian vault
        self.vault.log_tool_call(tool_name, args, str(res), session_id)
        return res
