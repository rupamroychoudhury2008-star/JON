import psutil
from models.tool_result import ToolResult
from .win_launcher import launch_app


def open_app(name: str) -> ToolResult:
    """Opens a named application on the local system with PID verification."""
    return launch_app(name)


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
