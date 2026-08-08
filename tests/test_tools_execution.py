import time
import os
import psutil
import pytest
from tools.executor import ToolExecutor
from models.tool_result import ToolResult

def is_process_running(name: str) -> bool:
    name_lower = name.lower()
    for p in psutil.process_iter(['name']):
        try:
            pname = p.info['name'].lower()
            if name_lower in pname:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return False

def test_open_and_close_notepad():
    executor = ToolExecutor()
    
    # 1. Open Notepad
    res_open = executor.execute_tool("open_app", {"name": "notepad"})
    assert isinstance(res_open, ToolResult)
    assert res_open.success == True
    time.sleep(1.0)
    assert is_process_running("notepad") == True

    # 2. Close Notepad
    res_close = executor.execute_tool("close_app", {"name": "notepad"})
    assert isinstance(res_close, ToolResult)
    assert res_close.success == True
    time.sleep(1.0)
    assert is_process_running("notepad") == False

def test_open_and_close_calculator():
    executor = ToolExecutor()

    # 1. Open Calc
    res_open = executor.execute_tool("open_app", {"name": "calc"})
    assert isinstance(res_open, ToolResult)
    assert res_open.success == True
    time.sleep(1.0)

    # 2. Close Calc
    res_close = executor.execute_tool("close_app", {"name": "calc"})
    assert isinstance(res_close, ToolResult)
    assert res_close.success == True

def test_file_tools_read_write():
    executor = ToolExecutor()
    test_path = os.path.abspath("test_tool_output.txt")

    # 1. Write file
    res_write = executor.execute_tool("write_file", {"path": test_path, "content": "JON AI Tool Execution Test Successful"})
    assert res_write.success == True

    # 2. Read file
    res_read = executor.execute_tool("read_file", {"path": test_path})
    assert res_read.success == True
    assert "JON AI Tool Execution Test Successful" in res_read.message

    # Cleanup
    if os.path.exists(test_path):
        os.remove(test_path)
