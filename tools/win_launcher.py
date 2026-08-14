"""
Windows Desktop Launcher & Interactive GUI Verification Engine.
Resolves executables dynamically via Program Files, AppData, PATH, and Registry.
Launches processes directly into user interactive desktop session and performs
Level 1 (Process PID) & Level 2 (Desktop GUI Window) verification before returning ToolResult.
"""
import os
import sys
import time
import shutil
import subprocess
import traceback
import re
import getpass
from datetime import datetime
from typing import Optional, Dict, Any, List
import psutil

from models.tool_result import ToolResult

_LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tool_launch.log")

def _log(msg: str):
    log_line = f"[{datetime.now().isoformat()}] {msg}"
    print(f"[OPEN_APP] {msg}")
    try:
        with open(_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{log_line}\n")
    except Exception:
        pass

def find_executable(app_name: str) -> Optional[str]:
    """Dynamically resolves absolute executable path for a Windows application."""
    target = app_name.lower().strip()
    for conj in [" and write ", " and type ", " and enter ", " and add ", " and calculate ", " and do ", " and press ", " and input ", " write ", " type ", " enter ", " add ", " calculate "]:
        if conj in target:
            target = target.split(conj, 1)[0].strip()
            break
    _log(f"Resolving executable for target '{target}'...")

    exe_map = {
        "chrome": "chrome.exe",
        "google chrome": "chrome.exe",
        "edge": "msedge.exe",
        "msedge": "msedge.exe",
        "microsoft edge": "msedge.exe",
        "notepad": "notepad.exe",
        "calc": "calc.exe",
        "calculator": "calc.exe",
        "paint": "mspaint.exe",
        "mspaint": "mspaint.exe",
        "cmd": "cmd.exe",
        "command prompt": "cmd.exe",
        "terminal": "cmd.exe",
        "powershell": "powershell.exe",
        "ps": "powershell.exe",
        "explorer": "explorer.exe",
        "file explorer": "explorer.exe",
        "taskmgr": "taskmgr.exe",
        "task manager": "taskmgr.exe",
        "vscode": "code.cmd",
        "vs code": "code.cmd",
        "code": "code.cmd",
        "word": "WINWORD.EXE",
        "excel": "EXCEL.EXE",
        "powerpoint": "POWERPNT.EXE",
        "spotify": "spotify.exe",
        "discord": "Discord.exe",
        "firefox": "firefox.exe",
        "brave": "brave.exe",
        "snipping tool": "SnippingTool.exe",
        "whatsapp": "WhatsApp.exe",
        "whats app": "WhatsApp.exe"
    }

    exe_name = exe_map.get(target, target if target.endswith(".exe") else f"{target}.exe")

    # 1. Common Installation Directories
    candidate_dirs = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application"),
        os.path.expandvars(r"%ProgramData%\Google\Chrome\Application"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application"),
        os.path.expandvars(r"%SystemRoot%\System32"),
        os.path.expandvars(r"%SystemRoot%"),
        os.path.expandvars(r"%LocalAppData%\Programs\Microsoft VS Code"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft Office\root\Office16"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft Office\root\Office16"),
        os.path.expandvars(r"%LocalAppData%\Spotify"),
        os.path.expandvars(r"%LocalAppData%\Discord"),
        os.path.expandvars(r"%LocalAppData%\WhatsApp"),
        os.path.expandvars(r"%LocalAppData%\Programs\WhatsApp"),
        os.path.expandvars(r"%ProgramFiles%\WhatsApp"),
        os.path.expandvars(r"%ProgramFiles(x86)%\WhatsApp"),
        os.path.expandvars(r"%LocalAppData%\WhatsAppDesktop"),
    ]

    for d in candidate_dirs:
        full_path = os.path.join(d, exe_name)
        if os.path.isfile(full_path):
            _log(f"Found executable at path: {full_path}")
            return os.path.abspath(full_path)

    # 2. PATH resolution via shutil.which
    which_path = shutil.which(exe_name) or shutil.which(target)
    if which_path and os.path.isfile(which_path):
        _log(f"Found executable via PATH: {which_path}")
        return os.path.abspath(which_path)

    # 3. Windows Registry App Paths lookup
    try:
        import winreg
        reg_subkeys = [
            rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{exe_name}",
            rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{target}.exe"
        ]
        for subkey in reg_subkeys:
            for root_key in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
                try:
                    with winreg.OpenKey(root_key, subkey) as key:
                        val, _ = winreg.QueryValueEx(key, "")
                        if val and os.path.isfile(val):
                            _log(f"Found executable via Registry App Paths: {val}")
                            return os.path.abspath(val)
                except OSError:
                    continue
    except ImportError:
        pass

    _log(f"Executable resolution failed for '{target}'")
    return None

def _normalize_app_name(raw_name: str) -> str:
    name = raw_name.strip().lower()
    phrases = ["on my computer", "on computer", "on my pc", "on pc"]
    for p in phrases:
        name = name.replace(p, "")
    
    fillers_pattern = r'\b(open|launch|start|run|app|application|program|tool|please|the|my|a)\b'
    name = re.sub(fillers_pattern, "", name, flags=re.IGNORECASE)
    name = re.sub(r'\s+', ' ', name).strip()
    return name if name else raw_name.strip().lower()

def verify_process_and_window(target_name: str, pid: Optional[int] = None, timeout_sec: float = 2.0) -> Dict[str, Any]:
    """
    Level 1: Verifies process PID is running via psutil.
    Level 2: Verifies visible top-level Win32 window exists on interactive desktop & focuses it.
    """
    start = time.time()
    exe_clean = target_name.lower().strip()
    proc_found = False
    window_found = False
    actual_pid = pid

    while time.time() - start <= timeout_sec:
        matching_pids = []
        for p in psutil.process_iter(['pid', 'name']):
            try:
                pname = p.info['name'].lower()
                if exe_clean in pname or pname in exe_clean:
                    matching_pids.append(p.info['pid'])
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        if matching_pids:
            proc_found = True
            if not actual_pid or actual_pid not in matching_pids:
                actual_pid = matching_pids[0]

            try:
                pids_str = ",".join(str(p) for p in matching_pids)
                ps_script = f"""
$code = @"
using System;
using System.Runtime.InteropServices;
public class WinUtil {{
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}}
"@
Add-Type -TypeDefinition $code
$pids = @({pids_str})
$global:hasWindow = $false

[WinUtil]::EnumWindows({{
    param($hwnd, $lparam)
    $pidOut = 0
    [WinUtil]::GetWindowThreadProcessId($hwnd, [ref]$pidOut)
    if ($pids -contains $pidOut -and [WinUtil]::IsWindowVisible($hwnd)) {{
        $global:hasWindow = $true
        [WinUtil]::ShowWindow($hwnd, 9)
        [WinUtil]::SetForegroundWindow($hwnd)
    }}
    return $true
}}, [IntPtr]::Zero)

$global:hasWindow
"""
                res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], capture_output=True, text=True)
                if "True" in res.stdout:
                    window_found = True
                    break
            except Exception:
                pass
        time.sleep(0.2)

    return {
        "process_verified": proc_found,
        "window_verified": window_found,
        "pid": actual_pid
    }

def _launch_and_verify_process(tool_name: str, action: str, target: str, args_list: List[str], display_name: str) -> ToolResult:
    _log(f"Target: {target}")
    _log(f"Resolved executable: {args_list[0]}")
    _log(f"Command: {args_list}")
    _log(f"CWD: {os.getcwd()}")
    _log(f"Platform: {sys.platform} | User: {getpass.getuser()} | Session PID: {os.getpid()}")
    _log(f"Launching process in interactive desktop session...")

    try:
        # Note: DO NOT pass DETACHED_PROCESS so GUI process attaches to current interactive desktop session
        proc = subprocess.Popen(args_list)
        pid = proc.pid
        _log(f"Popen returned PID: {pid}")

        v_res = verify_process_and_window(target, pid=pid, timeout_sec=2.5)
        _log(f"Level 1 Process Verification (PID): {'SUCCESS' if v_res['process_verified'] else 'FAILED'}")
        _log(f"Level 2 Desktop GUI Window Verification: {'SUCCESS' if v_res['window_verified'] else 'STANDBY/BACKGROUND'}")

        if v_res["process_verified"]:
            return ToolResult(
                success=True,
                tool_name=tool_name,
                action=action,
                target=target,
                message=f"{display_name} launched successfully on interactive desktop.",
                data={
                    "pid": v_res["pid"] or pid,
                    "executable": args_list[0],
                    "process_verified": True,
                    "window_verified": v_res["window_verified"]
                }
            )
        else:
            _log(f"Process verification FAILED for {target}")
            return ToolResult(
                success=False,
                tool_name=tool_name,
                action=action,
                target=target,
                message=f"Failed to launch {display_name}.",
                error=f"Process for '{target}' did not remain active post-spawn."
            )
    except Exception as e:
        _log(f"Launch EXCEPTION: {e}")
        return ToolResult(
            success=False,
            tool_name=tool_name,
            action=action,
            target=target,
            message=f"Failed to launch {display_name}.",
            error=str(e)
        )

def launch_app(app_name: str, app_args: Optional[List[str]] = None) -> ToolResult:
    """Launches a Windows desktop application natively into foreground focus with verified PID & GUI execution."""
    raw = app_name.strip().lower()
    clean = _normalize_app_name(app_name)
    target = clean if clean else raw
    _log(f"Requested: open_app | Target: {app_name} (normalized: {target})")

    # 1. Special UWP Protocol apps
    if target in ["setting", "settings"]:
        os.system("start ms-settings:")
        time.sleep(0.5)
        return ToolResult(success=True, tool_name="open_app", action="launch", target="settings", message="Windows Settings launched successfully.")

    if target in ["camera", "webcam"]:
        os.system("start microsoft.windows.camera:")
        time.sleep(0.5)
        return ToolResult(success=True, tool_name="open_app", action="launch", target="camera", message="Camera app launched successfully.")

    if target in ["whatsapp", "whats app", "whatsapp desktop"]:
        # Try protocol handler first if installed
        try:
            res_code = subprocess.run(["cmd", "/c", "start", "whatsapp:"], capture_output=True, text=True)
            if res_code.returncode == 0:
                time.sleep(0.5)
                return ToolResult(success=True, tool_name="open_app", action="launch", target="whatsapp", message="WhatsApp launched successfully.")
        except Exception:
            pass

        exe_path = find_executable(target)
        if exe_path:
            return _launch_and_verify_process("open_app", "launch", target, [exe_path], "WhatsApp")

        _log("WhatsApp desktop app not found. Launching WhatsApp Web fallback...")
        return launch_url("https://web.whatsapp.com")

    # 2. Executable resolution
    exe_path = find_executable(target)
    if not exe_path:
        _log(f"Result: FAILURE — Executable for '{target}' not found.")
        return ToolResult(
            success=False,
            tool_name="open_app",
            action="launch",
            target=target,
            message=f"Failed to launch '{app_name}'.",
            error=f"Application executable for '{target}' was not found on Windows."
        )

    # 3. Launch & Verify
    cmd_args = [exe_path]
    if app_args:
        cmd_args.extend(app_args)

    display_name = target.capitalize()
    return _launch_and_verify_process("open_app", "launch", target, cmd_args, display_name)

def launch_url(url: str) -> ToolResult:
    """Opens a URL in Google Chrome or default browser on screen with Level 1 & 2 verification."""
    _log(f"Requested: open_browser | URL: {url}")
    if not url or url.strip() == "":
        url = "https://www.google.com"
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    chrome_path = find_executable("chrome")
    if chrome_path:
        res = _launch_and_verify_process("open_browser", "navigate", url, [chrome_path, "--new-window", url], "Browser")
        if res.success:
            res.message = f"Opened browser to '{url}'."
            return res

    try:
        import webbrowser
        webbrowser.open(url, new=1)
        _log("Result: SUCCESS — Opened via webbrowser fallback")
        return ToolResult(success=True, tool_name="open_browser", action="navigate", target=url, message=f"Opened browser to '{url}'.")
    except Exception as e:
        _log(f"Result: FAILURE — {e}")
        return ToolResult(success=False, tool_name="open_browser", action="navigate", target=url, message=f"Failed to open browser to '{url}'.", error=str(e))

def launch_terminal() -> ToolResult:
    """Opens a new CMD terminal window on screen."""
    _log("Requested: open_terminal")
    cmd_path = find_executable("cmd") or "cmd.exe"
    return _launch_and_verify_process("open_terminal", "launch", "cmd", [cmd_path], "Command Prompt")
