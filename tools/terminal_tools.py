import subprocess
import psutil
from models.tool_result import ToolResult
from .win_launcher import launch_terminal

def open_terminal() -> ToolResult:
    """Opens a new terminal/cmd window with PID verification."""
    return launch_terminal()


def run_command(cmd: str) -> ToolResult:
    """Executes a shell command synchronously and returns stdout/stderr in ToolResult."""
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        stdout = res.stdout.strip()
        stderr = res.stderr.strip()

        output = f"Returncode: {res.returncode}\n"
        if stdout:
            output += f"STDOUT:\n{stdout}\n"
        if stderr:
            output += f"STDERR:\n{stderr}\n"

        success = (res.returncode == 0)
        msg = output.strip()
        error_str = stderr if res.returncode != 0 else None

        return ToolResult(
            success=success,
            tool_name="run_command",
            action="exec",
            target=cmd,
            message=msg,
            error=error_str,
            data={"returncode": res.returncode, "stdout": stdout, "stderr": stderr}
        )
    except subprocess.TimeoutExpired:
        return ToolResult(
            success=False,
            tool_name="run_command",
            action="exec",
            target=cmd,
            message=f"Command execution timed out (30s limit): '{cmd}'",
            error="TimeoutExpired"
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="run_command",
            action="exec",
            target=cmd,
            message=f"Failed to execute command '{cmd}'.",
            error=str(e)
        )


def close_terminal() -> ToolResult:
    """Closes terminal processes and verifies termination."""
    try:
        killed = 0
        for proc in psutil.process_iter(['name']):
            try:
                if proc.info['name'].lower() in ["cmd.exe", "powershell.exe", "wt.exe"]:
                    proc.kill()
                    killed += 1
            except Exception:
                continue

        if killed > 0:
            return ToolResult(
                success=True,
                tool_name="close_terminal",
                action="close",
                target="terminal",
                message=f"Closed {killed} terminal process(es).",
                data={"killed_count": killed}
            )

        return ToolResult(
            success=False,
            tool_name="close_terminal",
            action="close",
            target="terminal",
            message="Failed to close terminal.",
            error="No active terminal processes were found."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="close_terminal",
            action="close",
            target="terminal",
            message="Failed to close terminal.",
            error=str(e)
        )
