import os
from pathlib import Path
from models.tool_result import ToolResult

def read_file(path: str) -> ToolResult:
    """Reads content from a local file path with verified file existence."""
    try:
        file_path = Path(path).resolve()
        if not file_path.exists():
            return ToolResult(
                success=False,
                tool_name="read_file",
                action="read",
                target=path,
                message=f"Failed to read file '{path}'.",
                error=f"File does not exist at '{file_path}'"
            )
        if not file_path.is_file():
            return ToolResult(
                success=False,
                tool_name="read_file",
                action="read",
                target=path,
                message=f"Failed to read file '{path}'.",
                error=f"'{file_path}' is a directory, not a file."
            )

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return ToolResult(
            success=True,
            tool_name="read_file",
            action="read",
            target=path,
            message=f"Successfully read {len(content)} characters from '{file_path}':\n\n{content}",
            data={"char_count": len(content), "content": content}
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="read_file",
            action="read",
            target=path,
            message=f"Failed to read file '{path}'.",
            error=str(e)
        )

def write_file(path: str, content: str) -> ToolResult:
    """Writes content to a local file path with post-write verification."""
    try:
        file_path = Path(path).resolve()
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        if file_path.exists() and file_path.is_file():
            return ToolResult(
                success=True,
                tool_name="write_file",
                action="write",
                target=path,
                message=f"Successfully wrote {len(content)} characters to '{file_path}'.",
                data={"bytes_written": file_path.stat().st_size}
            )
        else:
            return ToolResult(
                success=False,
                tool_name="write_file",
                action="write",
                target=path,
                message=f"Failed to write file '{path}'.",
                error="File creation could not be verified post-write."
            )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="write_file",
            action="write",
            target=path,
            message=f"Failed to write file '{path}'.",
            error=str(e)
        )
