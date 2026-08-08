import os
import pytest
from orchestrator import JonOrchestrator

def test_full_fallback_tool_parsing():
    orch = JonOrchestrator()
    session = "test_full_tool_session"

    # 1. Open Terminal
    res_term = orch._fallback_parse_and_execute_tools("open terminal", session)
    assert res_term is not None
    msg, tools = res_term
    assert "open_terminal" in msg
    assert len(tools) == 1

    # 2. Write File
    test_path = os.path.abspath("test_full_output.txt")
    res_write = orch._fallback_parse_and_execute_tools(f"write file {test_path} content hello_full_tool", session)
    assert res_write is not None
    msg_w, _ = res_write
    assert "write_file" in msg_w
    assert os.path.exists(test_path)

    # 3. Read File
    res_read = orch._fallback_parse_and_execute_tools(f"read file {test_path}", session)
    assert res_read is not None
    msg_r, _ = res_read
    assert "read_file" in msg_r
    assert "hello_full_tool" in msg_r

    # Cleanup
    if os.path.exists(test_path):
        os.remove(test_path)

    # 4. Open Calculator
    res_calc = orch._fallback_parse_and_execute_tools("open calculator", session)
    assert res_calc is not None
    msg_c, _ = res_calc
    assert "open_app" in msg_c

    # 5. Close Calculator
    res_close_c = orch._fallback_parse_and_execute_tools("close calculator", session)
    assert res_close_c is not None
    msg_cc, _ = res_close_c
    assert "close_app" in msg_cc
