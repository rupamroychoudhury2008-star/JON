import pytest
from tools.win_launcher import _normalize_app_name, launch_app
from models.tool_result import ToolResult

def test_normalize_app_name_preserves_letters():
    assert _normalize_app_name("open notepad") == "notepad"
    assert _normalize_app_name("open calculator") == "calculator"
    assert _normalize_app_name("open paint") == "paint"
    assert _normalize_app_name("open camera") == "camera"
    assert _normalize_app_name("launch spotify on my computer") == "spotify"

def test_launch_app_non_existent_returns_failure():
    res = launch_app("non_existent_app_xyz_999")
    assert isinstance(res, ToolResult)
    assert res.success == False
    assert "was not found" in res.error.lower()

def test_launch_app_notepad():
    res = launch_app("notepad")
    assert isinstance(res, ToolResult)
    assert res.success == True
    assert "launched successfully" in res.message.lower()
