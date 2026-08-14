import json
import time
import urllib.parse
from typing import Dict, Any, Optional, List
from collections import defaultdict
from config.settings import settings
from router.intent_router import IntentRouter, UserRequest, IntentDecision
from router.network_detector import is_network_available
from memory.memory_manager import MemoryManager
from cloud_gateway.gateway import CloudGateway
from tools.executor import ToolExecutor, TOOLS_SCHEMA
from io_layer.tts import TextToSpeech

class JonOrchestrator:
    """Main state machine orchestrating Router, Memory, Cloud Gateway, Tools, and I/O."""

    def __init__(self,
                 router: Optional[IntentRouter] = None,
                 memory: Optional[MemoryManager] = None,
                 gateway: Optional[CloudGateway] = None,
                 tool_executor: Optional[ToolExecutor] = None,
                 tts: Optional[TextToSpeech] = None):

        self.router = router or IntentRouter()
        self.memory = memory or MemoryManager()
        self.gateway = gateway or CloudGateway()
        self.tool_executor = tool_executor or ToolExecutor(vault=self.memory.vault)
        self.tts = tts or TextToSpeech()

        # Conversation history per session (last N exchanges)
        self._conversation_history: Dict[str, List[Dict[str, str]]] = defaultdict(list)
        self._max_history_per_session = 10

    def _add_to_history(self, session_id: str, role: str, content: str):
        """Track conversation turns for multi-turn context."""
        history = self._conversation_history[session_id]
        history.append({"role": role, "content": content})
        if len(history) > self._max_history_per_session * 2:
            self._conversation_history[session_id] = history[-self._max_history_per_session * 2:]

    def _build_response_sentence(self, tool_results_list: List[Dict[str, Any]]) -> str:
        messages = []
        for tr in tool_results_list:
            if isinstance(tr, dict) and tr.get("message"):
                msg = tr.get("message")
                if tr.get("success"):
                    messages.append(msg)
                else:
                    err = f" (Error: {tr.get('error')})" if tr.get("error") else ""
                    messages.append(f"{msg}{err}")
        if not messages:
            return "Task completed."
        return "Done! " + " ".join(messages)

    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Returns the conversation history for a session."""
        return list(self._conversation_history.get(session_id, []))

    def process_request(self, request: UserRequest, force_offline: bool = False, speak_output: bool = False) -> Dict[str, Any]:
        """
        Executes full request pipeline with timing metrics.
        Handles both Online Cloud and Offline Local Execution seamlessly.
        """
        pipeline_start = time.time()
        timing = {}

        # 0. Add user message to history
        self._add_to_history(request.session_id, "user", request.text)

        # 1. Routing decision
        t0 = time.time()
        decision: IntentDecision = self.router.route(request, force_offline=force_offline)
        timing["routing_ms"] = round((time.time() - t0) * 1000, 1)

        # 2. Memory Retrieval
        t0 = time.time()
        memory_context = self.memory.get_relevant_context(request.text)
        timing["memory_retrieval_ms"] = round((time.time() - t0) * 1000, 1)

        # Build conversation context from history
        history = self.get_conversation_history(request.session_id)
        history_context = ""
        if len(history) > 2:
            recent = history[-6:-1]
            history_lines = []
            for entry in recent:
                prefix = "User" if entry["role"] == "user" else "Jon"
                history_lines.append(f"{prefix}: {entry['content'][:200]}")
            if history_lines:
                history_context = "\n--- Recent Conversation ---\n" + "\n".join(history_lines) + "\n---\n"

        full_context = memory_context
        if history_context:
            full_context = history_context + "\n" + memory_context

        response_text = ""
        path_handled = ""
        tool_results = []

        # 3. Direct Execution via Cloud API Gateway (100% Cloud Powered)
        t0 = time.time()
        try:
            path_handled = f"Cloud [{decision.intent}] -> {decision.target_model}"
            cloud_res = self.gateway.route_to_cloud(
                intent=decision.intent,
                request=request,
                context=full_context,
                tools_schema=TOOLS_SCHEMA if decision.intent == "device_automation" else None
            )

            if cloud_res.get("tool_calls"):
                tool_calls = cloud_res["tool_calls"]
                exec_outcomes = []
                executed_tool_names = []
                for tc in tool_calls:
                    func_info = tc.get("function", {})
                    t_name = func_info.get("name")
                    try:
                        t_args = json.loads(func_info.get("arguments", "{}")) if isinstance(func_info.get("arguments"), str) else func_info.get("arguments", {})
                    except Exception:
                        t_args = {}

                    executed_tool_names.append(t_name)
                    out = self.tool_executor.execute_tool(
                        tool_name=t_name,
                        args=t_args,
                        session_id=request.session_id
                    )
                    exec_outcomes.append(str(out))
                    tool_results.append(out.to_dict())

                typing_keywords = ["write ", "type ", "typewrite ", "inside ", "enter "]
                if any(w in request.text.lower() for w in typing_keywords) and "type_text" not in executed_tool_names:
                    fb_res = self._fallback_parse_and_execute_tools(request.text, request.session_id)
                    if fb_res:
                        fb_text, fb_tools = fb_res
                        exec_outcomes.append(fb_text)
                        tool_results.extend(fb_tools)

                response_text = "\n".join(exec_outcomes)
                if cloud_res.get("content"):
                    llm_txt = str(cloud_res["content"]).strip()
                    if not any(phrase in llm_txt.lower() for phrase in ["not capable", "cannot directly", "can't directly", "unable to interact", "don't have direct"]):
                        response_text = f"{llm_txt}\n\n{response_text}"
            else:
                response_text = cloud_res.get("content", "Task completed.")
                action_keywords = ["open", "launch", "start", "close", "stop", "kill", "run", "exec", "search", "read", "write", "type", "typewrite", "notepad", "calc", "chrome", "browser"]
                if decision.intent == "device_automation" or any(w in request.text.lower() for w in action_keywords):
                    fb_res = self._fallback_parse_and_execute_tools(request.text, request.session_id)
                    if fb_res:
                        fb_text, fb_tools = fb_res
                        response_text = fb_text
                        tool_results.extend(fb_tools)
        except Exception as cloud_err:
            path_handled = f"Cloud Exception ({type(cloud_err).__name__}: {str(cloud_err)[:100]})"
            response_text = f"Cloud API response error: {str(cloud_err)}"
            action_keywords = ["open", "launch", "start", "close", "stop", "kill", "run", "exec", "search", "read", "write", "type", "typewrite", "notepad", "calc", "chrome", "browser", "call", "dial", "phone", "email", "gmail"]
            if decision.intent == "device_automation" or any(w in request.text.lower() for w in action_keywords):
                fb_res = self._fallback_parse_and_execute_tools(request.text, request.session_id)
                if fb_res:
                    fb_text, fb_tools = fb_res
                    response_text = fb_text
                    tool_results.extend(fb_tools)

        timing["llm_execution_ms"] = round((time.time() - t0) * 1000, 1)

        if tool_results and (not response_text or "✓ Tool" in response_text or "✗ Tool" in response_text):
            response_text = self._build_response_sentence(tool_results)

        # 4. Save to Obsidian ShortTerm memory
        t0 = time.time()
        self.memory.save_interaction(
            session_id=request.session_id,
            request_text=request.text,
            path_handled=path_handled,
            response_text=response_text,
            tags=[decision.intent, "jon_interaction"]
        )
        timing["memory_save_ms"] = round((time.time() - t0) * 1000, 1)

        # 5. Add response to conversation history
        self._add_to_history(request.session_id, "assistant", response_text[:500])

        # 6. Timing metrics
        timing["total_ms"] = round((time.time() - pipeline_start) * 1000, 1)

        try:
            print(f"\n[Jon Response ({path_handled})]:\n{response_text}")
        except UnicodeEncodeError:
            safe_resp = response_text.encode('ascii', errors='backslashreplace').decode('ascii')
            safe_path = path_handled.encode('ascii', errors='backslashreplace').decode('ascii')
            print(f"\n[Jon Response ({safe_path})]:\n{safe_resp}")

        # 7. Speak output if requested or configured
        if speak_output or getattr(settings, 'io_default_output', 'text') == "voice":
            self.tts.speak(response_text)

        return {
            "session_id": request.session_id,
            "decision": decision.model_dump(),
            "path_handled": path_handled,
            "response": response_text,
            "tool_results": tool_results,
            "timing": timing
        }



    def _fallback_parse_and_execute_tools(self, text: str, session_id: str):
        import re
        lower = text.lower().strip()

        clean = lower
        for prefix in ["can you please ", "could you please ", "please ", "can you ", "could you ", "i want to ", "jon ", "hey jon ", "tell jon "]:
            if clean.startswith(prefix):
                clean = clean[len(prefix):].strip()

        # 0. Terminal Open / Close
        if clean in ["open terminal", "launch terminal", "new terminal", "start terminal"]:
            out = self.tool_executor.execute_tool("open_terminal", {}, session_id=session_id)
            return str(out), [out.to_dict()]
        if clean in ["close terminal", "exit terminal", "kill terminal"]:
            out = self.tool_executor.execute_tool("close_terminal", {}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 1. Search in browser / Google search
        if any(clean.startswith(w) for w in ["search ", "google ", "search for ", "search on google ", "google search "]):
            query = clean
            for prefix in ["search for ", "search on google ", "google search ", "search ", "google "]:
                if query.startswith(prefix):
                    query = query[len(prefix):].strip()
                    break
            url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
            out = self.tool_executor.execute_tool("open_browser", {"url": url}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 2. Phone call execution
        if any(clean.startswith(w) for w in ["call ", "dial ", "phone call ", "make call ", "make a call "]):
            target_num = clean
            for prefix in ["phone call to ", "make a call to ", "make call to ", "call ", "dial ", "phone call ", "make call "]:
                if target_num.startswith(prefix):
                    target_num = target_num[len(prefix):].strip()
                    break
            out = self.tool_executor.execute_tool("make_phone_call", {"phone_number": target_num}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 3. Compose Gmail / Email execution
        if any(clean.startswith(w) for w in ["email ", "gmail ", "send email ", "compose email ", "compose an email ", "write email "]):
            rest_email = clean
            for prefix in ["send email to ", "compose an email to ", "compose email to ", "email to ", "gmail to ", "send email ", "compose email ", "compose an email ", "email ", "gmail "]:
                if rest_email.startswith(prefix):
                    rest_email = rest_email[len(prefix):].strip()
                    break
            
            to_addr = rest_email.split(" ", 1)[0].strip()
            subject_str = ""
            body_str = ""

            if " subject " in rest_email:
                parts_subj = rest_email.split(" subject ", 1)
                to_addr = parts_subj[0].strip()
                remainder = parts_subj[1].strip()
                if " body " in remainder:
                    subj_body = remainder.split(" body ", 1)
                    subject_str = subj_body[0].strip()
                    body_str = subj_body[1].strip()
                else:
                    subject_str = remainder
            elif " body " in rest_email:
                parts_body = rest_email.split(" body ", 1)
                to_addr = parts_body[0].strip()
                body_str = parts_body[1].strip()
            
            out = self.tool_executor.execute_tool("compose_gmail", {"to": to_addr, "subject": subject_str, "body": body_str}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 4. Close app
        if any(clean.startswith(w) for w in ["close ", "stop ", "kill "]):
            target = clean
            for prefix in ["close app ", "close ", "stop app ", "stop ", "kill app ", "kill "]:
                if target.startswith(prefix):
                    target = target[len(prefix):].strip()
                    break
            out = self.tool_executor.execute_tool("close_app", {"name": target}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 5. WhatsApp chat & messaging
        if "whatsapp" in clean or "whats app" in clean:
            m_wa = re.search(r'(?:open\s+(?:chat\s+of|chat\s+with|chat\s+for|chat|to)\s+)?([a-zA-Z0-9_\+\s]+?)\s+(?:and\s+)?(?:write|type|send|text)\s+(?:a\s+text\s+to\s+him|to\s+him|message|text)?\s*(.+)$', clean, re.IGNORECASE)
            out1 = self.tool_executor.execute_tool("open_app", {"name": "whatsapp"}, session_id=session_id)
            if m_wa:
                text_msg = m_wa.group(2).strip()
                out2 = self.tool_executor.execute_tool("type_text", {"text": text_msg, "app_name": "whatsapp"}, session_id=session_id)
                return f"{out1}\n{out2}", [out1.to_dict(), out2.to_dict()]
            else:
                return str(out1), [out1.to_dict()]

        # 6. Calculator & Math operations (e.g. "open calculator and inside calculator add 2+3")
        if ("calc" in clean or "calculator" in clean) and not any(clean.startswith(w) for w in ["close ", "stop ", "kill "]):
            m_calc = re.search(r'(?:add|calculate|compute|do|type|write|enter)\s+([0-9\.\s\+\-\*\/\(\)]+)', clean, re.IGNORECASE)
            out1 = self.tool_executor.execute_tool("open_app", {"name": "calc"}, session_id=session_id)
            if m_calc:
                math_expr = m_calc.group(1).strip()
                out2 = self.tool_executor.execute_tool("type_text", {"text": f"{math_expr}=", "app_name": "calc"}, session_id=session_id)
                return f"{out1}\n{out2}", [out1.to_dict(), out2.to_dict()]
            return str(out1), [out1.to_dict()]

        # 6. Read / Write File
        if any(clean.startswith(w) for w in ["read file ", "view file ", "cat "]):
            path = clean
            for prefix in ["read file ", "view file ", "cat "]:
                if path.startswith(prefix):
                    path = path[len(prefix):].strip()
                    break
            out = self.tool_executor.execute_tool("read_file", {"path": path}, session_id=session_id)
            return str(out), [out.to_dict()]

        if any(clean.startswith(w) for w in ["write file ", "create file "]):
            rest = clean
            for prefix in ["write file ", "create file "]:
                if rest.startswith(prefix):
                    rest = rest[len(prefix):].strip()
                    break
            parts = rest.split(" content ", 1)
            path = parts[0].strip()
            content = parts[1].strip() if len(parts) > 1 else ""
            out = self.tool_executor.execute_tool("write_file", {"path": path, "content": content}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 7. Type / Write text into app or active window
        if any(clean.startswith(w) for w in ["write ", "type ", "typewrite ", "enter "]) and not clean.startswith("write file ") and not clean.startswith("write code") and not clean.startswith("write a ") and not clean.startswith("write python"):
            m = re.match(r'^(?:write|type|typewrite|enter)\s+(.+?)\s+(?:inside|in|into)\s+(?:the\s+)?([a-zA-Z0-9_\s]+)$', clean, re.IGNORECASE)
            if m:
                content_text = m.group(1).strip()
                target_app = m.group(2).strip()
                if (content_text.startswith('"') and content_text.endswith('"')) or (content_text.startswith("'") and content_text.endswith("'")):
                    content_text = content_text[1:-1]
                out = self.tool_executor.execute_tool("type_text", {"text": content_text, "app_name": target_app}, session_id=session_id)
                return str(out), [out.to_dict()]
            else:
                content_text = clean
                for prefix in ["write ", "type ", "typewrite ", "enter "]:
                    if content_text.startswith(prefix):
                        content_text = content_text[len(prefix):].strip()
                        break
                if (content_text.startswith('"') and content_text.endswith('"')) or (content_text.startswith("'") and content_text.endswith("'")):
                    content_text = content_text[1:-1]
                if content_text:
                    out = self.tool_executor.execute_tool("type_text", {"text": content_text}, session_id=session_id)
                    return str(out), [out.to_dict()]

        # 8. Close app
        if any(clean.startswith(w) for w in ["close ", "stop ", "kill "]):
            target = clean
            for prefix in ["close app ", "close ", "stop app ", "stop ", "kill app ", "kill "]:
                if target.startswith(prefix):
                    target = target[len(prefix):].strip()
                    break
            out = self.tool_executor.execute_tool("close_app", {"name": target}, session_id=session_id)
            return str(out), [out.to_dict()]

        # 9. Standalone app / Open commands
        if any(clean.startswith(w) for w in ["open ", "launch ", "start "]):
            target = clean
            for prefix in ["open app ", "open website ", "open ", "launch app ", "launch ", "start app ", "start "]:
                if target.startswith(prefix):
                    target = target[len(prefix):].strip()
                    break

            for suffix in [" on my computer", " on computer", " on my pc", " on pc", " please", " app", " application"]:
                if target.endswith(suffix):
                    target = target[:-len(suffix)].strip()

            known_sites = {
                "google": "https://www.google.com",
                "youtube": "https://www.youtube.com",
                "github": "https://www.github.com",
                "linkedin": "https://www.linkedin.com",
                "gmail": "https://mail.google.com",
                "google mail": "https://mail.google.com",
                "twitter": "https://www.x.com",
                "x": "https://www.x.com",
                "reddit": "https://www.reddit.com",
                "facebook": "https://www.facebook.com"
            }

            if target in known_sites or "." in target or target.startswith("http"):
                url = known_sites.get(target, target)
                if not url.startswith("http"):
                    url = f"https://{url}"
                out = self.tool_executor.execute_tool("open_browser", {"url": url}, session_id=session_id)
                return str(out), [out.to_dict()]
            else:
                m_comp = re.match(r'^([a-zA-Z0-9_\s]+?)\s+(?:and\s+)?(?:write|type|typewrite|enter|add|calculate|do|press|input|put)\s+(.+)$', target, re.IGNORECASE)
                if m_comp:
                    app_sub = m_comp.group(1).strip()
                    txt_sub = m_comp.group(2).strip()
                    out1 = self.tool_executor.execute_tool("open_app", {"name": app_sub}, session_id=session_id)
                    out2 = self.tool_executor.execute_tool("type_text", {"text": txt_sub, "app_name": app_sub}, session_id=session_id)
                    return f"{out1}\n{out2}", [out1.to_dict(), out2.to_dict()]

                out = self.tool_executor.execute_tool("open_app", {"name": target}, session_id=session_id)
                return str(out), [out.to_dict()]

        # 10. Standalone app names like "notepad", "calculator", "chrome", "spotify", "word"
        apps_standalone = [
            "notepad", "calc", "calculator", "cmd", "powershell", "explorer",
            "paint", "mspaint", "vscode", "code", "chrome", "edge", "msedge",
            "word", "excel", "powerpoint", "camera", "spotify", "discord",
            "firefox", "brave", "taskmgr", "task manager", "settings", "whatsapp"
        ]
        for app in apps_standalone:
            if clean == app or clean == f"open {app}":
                out = self.tool_executor.execute_tool("open_app", {"name": app}, session_id=session_id)
                return str(out), [out.to_dict()]
            elif clean.startswith(app) or clean.startswith(f"open {app}"):
                rest = clean[len(app):].strip() if clean.startswith(app) else clean[len(f"open {app}"):].strip()
                m_rest = re.match(r'^(?:and\s+)?(?:write|type|typewrite|enter|add|calculate|do|press|input|put)\s+(.+)$', rest, re.IGNORECASE)
                if m_rest:
                    txt_sub = m_rest.group(1).strip()
                    if (txt_sub.startswith('"') and txt_sub.endswith('"')) or (txt_sub.startswith("'") and txt_sub.endswith("'")):
                        txt_sub = txt_sub[1:-1]
                    out1 = self.tool_executor.execute_tool("open_app", {"name": app}, session_id=session_id)
                    out2 = self.tool_executor.execute_tool("type_text", {"text": txt_sub, "app_name": app}, session_id=session_id)
                    return f"{out1}\n{out2}", [out1.to_dict(), out2.to_dict()]

        return None
