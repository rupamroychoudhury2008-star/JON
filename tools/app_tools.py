import time
import subprocess
import psutil
from typing import Optional
from models.tool_result import ToolResult
from .win_launcher import launch_app, verify_process_and_window

try:
    import pyperclip
except ImportError:
    pyperclip = None

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    pyautogui.PAUSE = 0.05
except ImportError:
    pyautogui = None


def open_app(name: str) -> ToolResult:
    """Opens a named application on the local system with PID verification."""
    return launch_app(name)


def type_text(text: str, app_name: Optional[str] = None) -> ToolResult:
    """Types or pastes specified text into a targeted desktop application or active window."""
    try:
        target_display = app_name or "active window"
        if app_name:
            clean_app = app_name.strip().lower()
            v_res = verify_process_and_window(clean_app, timeout_sec=1.5)
            if not v_res.get("process_verified"):
                launch_res = launch_app(clean_app)
                if not launch_res.success:
                    return ToolResult(
                        success=False,
                        tool_name="type_text",
                        action="type",
                        target=clean_app,
                        message=f"Failed to focus or launch '{clean_app}'.",
                        error=launch_res.error
                    )
                time.sleep(1.0)
            else:
                time.sleep(0.4)

        is_calc = app_name and app_name.strip().lower() in ["calc", "calculator", "calculatorapp"]
        text_to_send = text
        if is_calc and not text_to_send.endswith("="):
            text_to_send = text_to_send + "="

        if is_calc and pyautogui:
            clean_calc_text = text_to_send.replace(" ", "")
            pyautogui.typewrite(clean_calc_text, interval=0.05)
        elif pyperclip:
            pyperclip.copy(text)
            time.sleep(0.1)
            if pyautogui:
                pyautogui.hotkey('ctrl', 'v')
            else:
                ps_cmd = "$w = New-Object -ComObject WScript.Shell; $w.SendKeys('^v')"
                subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True)
        else:
            try:
                escaped_text = text.replace("'", "''")
                ps_cmd = f"Set-Clipboard -Value '{escaped_text}'; $w = New-Object -ComObject WScript.Shell; $w.SendKeys('^v')"
                subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True)
            except Exception:
                if pyautogui:
                    pyautogui.write(text, interval=0.01)

        return ToolResult(
            success=True,
            tool_name="type_text",
            action="type",
            target=target_display,
            message=f"Successfully typed '{text}' into {target_display}.",
            data={"text": text, "app_name": app_name}
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="type_text",
            action="type",
            target=app_name or "active window",
            message=f"Failed to type text into {app_name or 'active window'}.",
            error=str(e)
        )



def close_app(name: str) -> ToolResult:
    """Closes a running application by process name and verifies process termination."""
    try:
        target_raw = name.lower().strip()

        aliases = {
            "calculator": ["calc", "calculatorapp"],
            "calc": ["calc", "calculatorapp"],
            "chrome": ["chrome"],
            "browser": ["chrome", "msedge", "firefox", "brave"],
            "edge": ["msedge", "edge"],
            "notepad": ["notepad"],
            "paint": ["mspaint", "paint"],
            "cmd": ["cmd"],
            "terminal": ["cmd", "wt", "powershell"],
            "word": ["winword", "word"],
            "excel": ["excel"],
            "powerpoint": ["powerpnt", "ppt"],
            "spotify": ["spotify"],
            "discord": ["discord"]
        }

        targets = aliases.get(target_raw, [target_raw])
        if target_raw not in targets:
            targets.append(target_raw)

        target_exes = [t if t.endswith(".exe") else f"{t}.exe" for t in targets]

        killed = 0
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                pname = proc.info['name'].lower()
                if any(t == pname or t in pname for t in targets + target_exes):
                    proc.kill()
                    killed += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if killed > 0:
            return ToolResult(
                success=True,
                tool_name="close_app",
                action="close",
                target=name,
                message=f"Closed {killed} process(es) matching '{name}'.",
                data={"killed_count": killed}
            )

        return ToolResult(
            success=False,
            tool_name="close_app",
            action="close",
            target=name,
            message=f"Failed to close '{name}'.",
            error=f"No running processes found matching '{name}'."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="close_app",
            action="close",
            target=name,
            message=f"Failed to close '{name}'.",
            error=str(e)
        )

