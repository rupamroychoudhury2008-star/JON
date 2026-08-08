import pytest
import time
import os
import psutil
from models.tool_result import ToolResult
from tools.win_launcher import find_executable, launch_app, launch_url
from tools.executor import ToolExecutor
from orchestrator import JonOrchestrator

def is_process_running(executable_name: str) -> bool:
    target = executable_name.lower()
    for p in psutil.process_iter(['name']):
        try:
            pname = p.info['name'].lower()
            if target in pname or pname in target:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return False

def test_executable_resolution_chrome():
    chrome_path = find_executable("chrome")
    assert chrome_path is not None
    assert os.path.isfile(chrome_path)
    assert chrome_path.lower().endswith("chrome.exe")

def test_open_chrome_success():
    res = launch_app("chrome")
    assert isinstance(res, ToolResult)
    assert res.success == True
    assert res.tool_name == "open_app"
    assert res.action == "launch"
    assert res.target == "chrome"
    assert "launched successfully" in res.message.lower() or "opened" in res.message.lower()
    time.sleep(1.0)
    assert is_process_running("chrome") == True

def test_launch_chrome_success():
    res = launch_app("launch chrome")
    assert isinstance(res, ToolResult)
    assert res.success == True
    assert is_process_running("chrome") == True

def test_open_google_url_success():
    res = launch_url("https://www.google.com")
    assert isinstance(res, ToolResult)
    assert res.success == True
    assert res.tool_name == "open_browser"
    assert "google" in res.target.lower()

def test_open_nonexistent_app_failure():
    res = launch_app("nonexistent_app_xyz_999")
    assert isinstance(res, ToolResult)
    assert res.success == False
    assert res.tool_name == "open_app"
    assert res.error is not None
    assert "was not found" in res.error.lower()

def test_executor_returns_structured_tool_result():
    executor = ToolExecutor()
    res = executor.execute_tool("open_app", {"name": "notepad"})
    assert isinstance(res, ToolResult)
    assert res.success == True
    time.sleep(0.5)

    res_close = executor.execute_tool("close_app", {"name": "notepad"})
    assert isinstance(res_close, ToolResult)
    assert res_close.success == True

def test_orchestrator_returns_tool_results_contract():
    orch = JonOrchestrator()
    res_tuple = orch._fallback_parse_and_execute_tools("open chrome", "session_test_truthful")
    assert res_tuple is not None
    msg, tool_results = res_tuple
    assert len(tool_results) == 1
    tr = tool_results[0]
    assert tr["success"] == True
    assert tr["tool_name"] == "open_app"
    assert tr["target"] == "chrome"
