import json
import os
import time
import mimetypes
import urllib.parse
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from config.settings import settings
from orchestrator import JonOrchestrator
from io_layer.input_handler import InputHandler
from router.network_detector import is_network_available
from memory.promoter import MemoryPromoter
from memory.obsidian_vault import ObsidianVault

DIST_DIR = Path(__file__).parent / "command-center" / "dist"

orchestrator = JonOrchestrator()
input_handler = InputHandler()
vault = ObsidianVault()

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jon AI — Liquid Glass</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        
        :root, [data-color-mode="dark"], [data-theme="dark"] {
            --bg-body: #212121;
            --bg-radial-1: rgba(16, 163, 127, 0.12);
            --bg-radial-2: rgba(16, 163, 127, 0.08);
            --bg-radial-3: rgba(16, 163, 127, 0.04);
            --glass-bg: #171717;
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            --header-bg: #171717;
            --header-border: rgba(255, 255, 255, 0.1);
            --title-color-1: #ececec;
            --title-color-2: #10a37f;
            --text-color: #ececec;
            --jon-msg-bg: #2f2f2f;
            --jon-msg-border: rgba(255, 255, 255, 0.12);
            --jon-msg-text: #ececec;
            --code-bg: #171717;
            --code-text: #10a37f;
            --input-bar-bg: #2f2f2f;
            --input-field-bg: #2f2f2f;
            --input-field-border: rgba(255, 255, 255, 0.12);
            --input-field-text: #ececec;
            --input-placeholder: #8e8e8e;
            --btn-bg: #2f2f2f;
            --btn-border: rgba(255, 255, 255, 0.15);
            --btn-text: #ececec;
            --scrollbar-thumb: rgba(255, 255, 255, 0.15);
        }

        [data-color-mode="light"], [data-theme="light"] {
            --bg-body: #eef2f6;
            --bg-radial-1: rgba(14, 165, 233, 0.12);
            --bg-radial-2: rgba(139, 92, 246, 0.12);
            --bg-radial-3: rgba(56, 189, 248, 0.05);
            --glass-bg: rgba(255, 255, 255, 0.85);
            --glass-border: rgba(15, 23, 42, 0.12);
            --glass-shadow: 0 20px 50px rgba(0, 0, 0, 0.1), 0 0 30px rgba(14, 165, 233, 0.1);
            --header-bg: rgba(241, 245, 249, 0.85);
            --header-border: rgba(15, 23, 42, 0.08);
            --title-color-1: #0f172a;
            --title-color-2: #0284c7;
            --text-color: #0f172a;
            --jon-msg-bg: rgba(241, 245, 249, 0.95);
            --jon-msg-border: rgba(15, 23, 42, 0.1);
            --jon-msg-text: #0f172a;
            --code-bg: #1e293b;
            --code-text: #38bdf8;
            --input-bar-bg: rgba(248, 250, 252, 0.85);
            --input-field-bg: #ffffff;
            --input-field-border: rgba(15, 23, 42, 0.18);
            --input-field-text: #0f172a;
            --input-placeholder: #94a3b8;
            --btn-bg: linear-gradient(135deg, #ffffff, #f1f5f9);
            --btn-border: rgba(15, 23, 42, 0.15);
            --btn-text: #0f172a;
            --scrollbar-thumb: rgba(15, 23, 42, 0.2);
        }

        body {
            background: var(--bg-body);
            background-image: 
                radial-gradient(circle at 15% 15%, var(--bg-radial-1) 0%, transparent 45%),
                radial-gradient(circle at 85% 85%, var(--bg-radial-2) 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, var(--bg-radial-3) 0%, transparent 60%);
            color: var(--text-color);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
            overflow: hidden;
            font-size: 14px;
            transition: background 0.3s ease, color 0.3s ease;
        }

        .glass-app {
            width: 100%;
            max-width: 900px;
            height: 94vh;
            background: var(--glass-bg);
            backdrop-filter: blur(24px) saturate(190%);
            -webkit-backdrop-filter: blur(24px) saturate(190%);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            box-shadow: var(--glass-shadow), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            overflow: hidden;
            transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            border-bottom: 1px solid var(--header-border);
            background: var(--header-bg);
            backdrop-filter: blur(16px);
        }

        .header-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .title-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo-icon {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: linear-gradient(135deg, #38bdf8, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 14px;
            color: #ffffff;
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }

        .title {
            font-size: 1.05rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--title-color-1) 30%, var(--title-color-2) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.01em;
        }

        .status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #34d399;
            background: rgba(16, 185, 129, 0.12);
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 5px 12px;
            border-radius: 20px;
            box-shadow: 0 0 14px rgba(16, 185, 129, 0.2);
        }

        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #34d399;
            box-shadow: 0 0 8px #34d399;
            animation: pulse-dot 2s infinite;
        }

        .dot.offline {
            background: #f87171;
            box-shadow: 0 0 8px #f87171;
            color: #f87171;
        }

        @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        
        .chat-container {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scroll-behavior: smooth;
        }

        .chat-container::-webkit-scrollbar {
            width: 5px;
        }
        .chat-container::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 3px;
        }
        
        .msg {
            max-width: 82%;
            padding: 14px 18px;
            border-radius: 16px;
            font-size: 0.93rem;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-word;
            animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .user-msg {
            background: linear-gradient(135deg, rgba(14, 165, 233, 0.95), rgba(2, 132, 199, 0.95));
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 
                0 8px 24px rgba(2, 132, 199, 0.35),
                inset 0 1px 1px rgba(255, 255, 255, 0.35);
        }

        .jon-msg {
            background: var(--jon-msg-bg);
            backdrop-filter: blur(16px);
            color: var(--jon-msg-text);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid var(--jon-msg-border);
            box-shadow: 
                0 8px 24px rgba(0, 0, 0, 0.15),
                inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }

        .msg pre {
            background: var(--code-bg);
            border: 1px solid var(--glass-border);
            color: var(--code-text);
            padding: 12px 14px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 10px 0;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 0.86rem;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.3);
        }

        .msg code {
            font-family: 'Consolas', 'Courier New', monospace;
            background: rgba(56, 189, 248, 0.15);
            color: #0284c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.88rem;
        }
        
        .input-bar {
            padding: 16px 24px;
            border-top: 1px solid var(--header-border);
            background: var(--input-bar-bg);
            backdrop-filter: blur(20px);
            display: flex;
            gap: 12px;
            align-items: center;
        }

        .input-field {
            flex: 1;
            background: var(--input-field-bg);
            border: 1px solid var(--input-field-border);
            border-radius: 14px;
            padding: 12px 18px;
            color: var(--input-field-text);
            font-size: 0.92rem;
            outline: none;
            backdrop-filter: blur(12px);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .input-field::placeholder { color: var(--input-placeholder); }

        .input-field:focus {
            border-color: rgba(56, 189, 248, 0.6);
            box-shadow: 
                0 0 20px rgba(56, 189, 248, 0.25),
                inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }
        
        .btn {
            background: var(--btn-bg);
            border: 1px solid var(--btn-border);
            backdrop-filter: blur(12px);
            border-radius: 14px;
            color: var(--btn-text);
            padding: 12px 20px;
            font-weight: 600;
            font-size: 0.88rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 
                0 4px 14px rgba(0, 0, 0, 0.15),
                inset 0 1px 1px rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
        }

        .btn:hover {
            border-color: rgba(56, 189, 248, 0.4);
            transform: translateY(-1px);
        }

        .btn-theme {
            padding: 8px 12px;
            font-size: 1rem;
            border-radius: 12px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            border-color: rgba(255, 255, 255, 0.3);
            color: #ffffff;
            box-shadow: 
                0 4px 20px rgba(2, 132, 199, 0.45),
                inset 0 1px 1px rgba(255, 255, 255, 0.4);
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #38bdf8, #0ea5e9);
            box-shadow: 
                0 6px 24px rgba(2, 132, 199, 0.6),
                inset 0 1px 1px rgba(255, 255, 255, 0.5);
        }

        .btn-listening {
            background: linear-gradient(135deg, #ef4444, #dc2626) !important;
            border-color: rgba(255, 255, 255, 0.4) !important;
            color: #ffffff !important;
            box-shadow: 0 0 24px rgba(239, 68, 68, 0.6) !important;
            animation: pulse-glow 1.5s infinite;
        }
        
        @keyframes pulse-glow {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
            50% { transform: scale(1.02); box-shadow: 0 0 30px rgba(239, 68, 68, 0.85); }
        }
    </style>
</head>
<body>
    <div class="glass-app">
        <div class="header">
            <div class="title-wrap">
                <div class="logo-icon">J</div>
                <span class="title">Jon AI</span>
            </div>
            <div class="header-controls">
                <button type="button" class="btn btn-theme" id="theme-btn" onclick="toggleTheme()" title="Toggle Light / Dark Mode">
                    <span id="theme-icon">☀️</span>
                </button>
                <span class="status" id="status-badge"><span class="dot" id="status-dot"></span><span id="status-text">ONLINE</span></span>
            </div>
        </div>

        <div class="chat-container" id="chat-box">
            <div class="msg jon-msg">Hello! I am Jon. How can I help you?</div>
        </div>

        <div class="input-bar">
            <input type="text" class="input-field" id="query-input" placeholder="Type a command or query..." onkeydown="if(event.key==='Enter'){event.preventDefault();sendQuery();}">
            <button type="button" class="btn" id="mic-btn" onclick="toggleMic()">🎤 Mic</button>
            <button type="button" class="btn btn-primary" id="send-btn" onclick="sendQuery()">Send</button>
        </div>
    </div>

    <script>
        function initTheme() {
            const savedTheme = localStorage.getItem('jon_color_mode') || localStorage.getItem('jon_theme') || 'dark';
            document.documentElement.setAttribute('data-color-mode', savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-color-mode') || document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-color-mode', newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('jon_color_mode', newTheme);
            localStorage.setItem('jon_theme', newTheme);
            updateThemeIcon(newTheme);
        }

        function updateThemeIcon(theme) {
            const icon = document.getElementById('theme-icon');
            if (icon) {
                icon.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }

        initTheme();

        let recognition = null;

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(String(text)));
            return div.innerHTML;
        }

        function formatText(text) {
            if (!text) return '';
            let formatted = escapeHtml(text);
            formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
            formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.split('\\n').join('<br>');
            return formatted;
        }

        function appendMsg(sender, text) {
            const chatBox = document.getElementById('chat-box');
            if (!chatBox) return null;
            const div = document.createElement('div');
            div.className = 'msg ' + (sender === 'user' ? 'user-msg' : 'jon-msg');
            if (sender === 'user') {
                div.textContent = text;
            } else {
                div.innerHTML = formatText(text);
            }
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
            return div;
        }

        function fetchHealth() {
            fetch('/health').then(res => res.json()).then(data => {
                const isOnline = data.network_online || data.status === 'healthy';
                document.getElementById('status-text').textContent = isOnline ? 'ONLINE' : 'OFFLINE';
                document.getElementById('status-dot').className = 'dot' + (isOnline ? '' : ' offline');
            }).catch(() => {
                document.getElementById('status-text').textContent = 'OFFLINE';
                document.getElementById('status-dot').className = 'dot offline';
            });
        }

        function sendQuery() {
            const input = document.getElementById('query-input');
            const text = input ? input.value.trim() : '';
            if (!text) return;

            if (recognition) {
                try { recognition.stop(); } catch(e) {}
                recognition = null;
                document.getElementById('mic-btn').classList.remove('btn-listening');
                document.getElementById('mic-btn').textContent = '🎤 Mic';
            }

            appendMsg('user', text);
            input.value = '';

            const loader = appendMsg('jon', 'Thinking...');
            const sendBtn = document.getElementById('send-btn');
            sendBtn.disabled = true;

            fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, source: 'web' })
            }).then(res => res.json()).then(data => {
                if (loader) loader.remove();
                appendMsg('jon', data.response || 'No response.');
                fetchHealth();
            }).catch(err => {
                if (loader) loader.remove();
                appendMsg('jon', 'Error: ' + err.message);
            }).finally(() => {
                sendBtn.disabled = false;
            });
        }

        function toggleMic() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                alert('Speech Recognition is not supported in this browser.');
                return;
            }

            const btn = document.getElementById('mic-btn');
            const input = document.getElementById('query-input');

            if (recognition) {
                recognition.stop();
                recognition = null;
                btn.classList.remove('btn-listening');
                btn.textContent = '🎤 Mic';
                if (input && input.value.trim()) sendQuery();
                return;
            }

            try {
                recognition = new SpeechRec();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                btn.classList.add('btn-listening');
                btn.textContent = '🎙 Listening...';

                recognition.onresult = (e) => {
                    let txt = '';
                    for (let i = 0; i < e.results.length; i++) {
                        txt += e.results[i][0].transcript;
                    }
                    if (input) input.value = txt;
                };

                recognition.onend = () => {
                    btn.classList.remove('btn-listening');
                    btn.textContent = '🎤 Mic';
                    recognition = null;
                    if (input && input.value.trim()) sendQuery();
                };

                recognition.start();
            } catch(err) {
                btn.classList.remove('btn-listening');
                btn.textContent = '🎤 Mic';
                recognition = null;
            }
        }

        fetchHealth();
    </script>
</body>
</html>
"""

class JonHTTPRequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def _send_html(self, status_code: int, html_content: str):
        self.send_response(status_code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(html_content.encode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(200, {"status": "ok"})

    def do_HEAD(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        if path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
        elif path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
        else:
            self.send_response(200)
            self.end_headers()

    def _serve_file(self, file_path: Path):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            mime_type, _ = mimetypes.guess_type(str(file_path))
            mime_type = mime_type or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query_params = urllib.parse.parse_qs(parsed_path.query)

        if path in ["/health", "/api/health"]:
            net_online = is_network_available()

            from cloud_gateway.groq_adapter import GroqAdapter
            from cloud_gateway.nvidia_llama_adapter import NvidiaLlamaAdapter
            from cloud_gateway.nvidia_nemotron_adapter import NvidiaNemotronAdapter

            groq_v = GroqAdapter().validate_key()
            nvidia_c_v = NvidiaLlamaAdapter().validate_key()
            nvidia_a_v = NvidiaNemotronAdapter().validate_key()

            self._send_json(200, {
                "status": "healthy",
                "system": settings.assistant_name,
                "network_online": net_online,
                "mode": "100% Cloud API Powered",
                "keys_configured": {
                    "groq": bool(settings.groq_api_key),
                    "nvidia_coding": bool(settings.nvidia_coding_api_key),
                    "nvidia_automation": bool(settings.nvidia_automation_api_key),
                    "obsidian_rest": bool(settings.obsidian_rest_key)
                },
                "keys_validation": {
                    "groq": groq_v,
                    "nvidia_coding": nvidia_c_v,
                    "nvidia_automation": nvidia_a_v
                }
            })

        elif "system_metrics" in path or "telemetry" in path:
            try:
                import psutil
                mem = psutil.virtual_memory()
                cpu = psutil.cpu_percent(interval=None)
                disk = psutil.disk_usage('C:' if os.name == 'nt' else '/')
                self._send_json(200, {
                    "status": "ok",
                    "cpu_percent": round(cpu, 1),
                    "ram_percent": round(mem.percent, 1),
                    "ram_used_gb": round(mem.used / (1024**3), 2),
                    "ram_total_gb": round(mem.total / (1024**3), 2),
                    "ram_free_gb": round(mem.available / (1024**3), 2),
                    "disk_percent": round(disk.percent, 1),
                    "disk_used_gb": round(disk.used / (1024**3), 2),
                    "disk_total_gb": round(disk.total / (1024**3), 2),
                    "timestamp": int(time.time() * 1000)
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})

        elif path == "/api/notes":
            notes = vault.read_all_notes()
            note_list = []
            for n in notes:
                rel_path = str(n.path.relative_to(vault.vault_path))
                note_list.append({
                    "path": rel_path,
                    "frontmatter": n.frontmatter,
                    "snippet": n.content[:200]
                })
            self._send_json(200, {"total": len(note_list), "notes": note_list})

        elif path in ["/api/process", "/api/command"]:
            text_param = query_params.get("text", [None])[0] or query_params.get("prompt", [None])[0]
            if text_param:
                force_offline = query_params.get("force_offline", ["false"])[0].lower() == "true"
                req = input_handler.process_text_input(text_param)
                result = orchestrator.process_request(req, force_offline=force_offline)
                self._send_json(200, result)
            else:
                self._send_json(200, {
                    "info": "Jon API Command Endpoint.",
                    "usage_get": "/api/command?text=Your+Query",
                    "usage_post": "POST /api/command with JSON body {'text': 'Your Query'}"
                })

        else:
            if DIST_DIR.exists():
                target_file = DIST_DIR / path.lstrip('/')
                if target_file.exists() and target_file.is_file():
                    self._serve_file(target_file)
                    return
                index_file = DIST_DIR / "index.html"
                if index_file.exists():
                    self._serve_file(index_file)
                    return
            self._send_html(200, INDEX_HTML)

    def do_POST(self):
        try:
            parsed_path = urllib.parse.urlparse(self.path)
            path = parsed_path.path
            query_params = urllib.parse.parse_qs(parsed_path.query)

            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"

            try:
                body = json.loads(body_bytes.decode("utf-8"))
            except Exception:
                body = {}

            if path in ["/api/process", "/api/command"]:
                text = body.get("text", "").strip() or body.get("prompt", "").strip() or body.get("command", "").strip()
                if not text:
                    self._send_json(400, {"error": "Missing 'text' or 'prompt' in request body"})
                    return

                query_force_offline = query_params.get("force_offline", ["false"])[0].lower() == "true"
                force_offline = bool(body.get("force_offline", False)) or query_force_offline
                source = body.get("source", "voice" if body.get("is_voice") else "text")

                req = input_handler.process_text_input(text)
                req.source = source

                result = orchestrator.process_request(req, force_offline=force_offline)
                self._send_json(200, result)

            elif path == "/api/promote":
                promoter = MemoryPromoter()
                res = promoter.run_promotion()
                self._send_json(200, res)

            else:
                self._send_json(404, {"error": "Endpoint not found"})

        except Exception as err:
            self._send_json(500, {"error": f"Server POST Error: {str(err)}"})

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server(port: int = None):
    if port is None:
        port_env = os.environ.get("PORT")
        port = int(port_env) if port_env and port_env.isdigit() else int(getattr(settings, "server_port", 8000))

    server_address = ("0.0.0.0", port)
    try:
        httpd = ThreadedHTTPServer(server_address, JonHTTPRequestHandler)
    except OSError as e:
        print(f"\n[ERROR]: Could not bind to port {port}: {e}")
        print(f"Port {port} may be occupied by an existing process. Please stop any running instance of server.py or kill the process on port {port}.")
        return

    print("=" * 60)
    print(f"       JON AI ASSISTANT BACKEND SERVER RUNNING ON PORT {port}")
    print(f"       Web Dashboard: http://localhost:{port}/")
    print(f"       Browser Query: http://localhost:{port}/api/process?text=Your+Query")
    print(f"       API Health:    http://localhost:{port}/health")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping backend server.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
