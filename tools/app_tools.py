import os
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
            "calculator": ["calc.exe", "calculatorapp.exe", "calculator.exe", "windowscalculator.exe", "calc", "calculatorapp"],
            "calc": ["calc.exe", "calculatorapp.exe", "calculator.exe", "windowscalculator.exe", "calc", "calculatorapp"],
            "chrome": ["chrome.exe", "chrome"],
            "browser": ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe"],
            "edge": ["msedge.exe", "edge.exe", "msedge"],
            "notepad": ["notepad.exe", "notepad"],
            "paint": ["mspaint.exe", "paint.exe", "mspaint"],
            "cmd": ["cmd.exe", "cmd"],
            "terminal": ["cmd.exe", "wt.exe", "powershell.exe"],
            "word": ["winword.exe", "word"],
            "excel": ["excel.exe"],
            "powerpoint": ["powerpnt.exe"],
            "spotify": ["spotify.exe"],
            "discord": ["discord.exe"],
            "whatsapp": ["whatsapp.exe", "whatsappdesktop.exe", "whatsapp"]
        }

        targets = aliases.get(target_raw, [target_raw, f"{target_raw}.exe"])

        killed = 0
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                pname = (proc.info.get('name') or '').lower()
                if pname and any(t.lower() == pname or t.lower() in pname for t in targets):
                    proc.kill()
                    killed += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied, AttributeError):
                continue

        if os.name == 'nt':
            for exe_name in set(targets):
                if not exe_name.endswith(".exe"):
                    exe_name = f"{exe_name}.exe"
                try:
                    tk_res = subprocess.run(["taskkill", "/F", "/T", "/IM", exe_name], capture_output=True, text=True)
                    if tk_res.returncode == 0:
                        killed += 1
                except Exception:
                    pass

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
            success=True,
            tool_name="close_app",
            action="close",
            target=name,
            message=f"Application '{name}' is not running (already closed).",
            data={"killed_count": 0}
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

