import sys
import argparse
from config.settings import settings
from orchestrator import JonOrchestrator
from io_layer.input_handler import InputHandler
from io_layer.stt import SpeechToText
from router.network_detector import is_network_available
from memory.promoter import MemoryPromoter

def print_banner():
    print("=" * 60)
    print("               JON — 100% Cloud API Powered AI OS")
    print(f" Vault Path: {settings.vault_path}")
    print(" Engine: Groq 70B & Nvidia NIM Nemotron Ultra 550B")
    print("=" * 60)

def handle_health():
    print("\n--- Jon System Health Check ---")
    net_online = is_network_available()
    print(f"Network Connection: {'ONLINE' if net_online else 'OFFLINE'}")

    from cloud_gateway.groq_adapter import GroqAdapter
    from cloud_gateway.nvidia_llama_adapter import NvidiaLlamaAdapter
    from cloud_gateway.nvidia_nemotron_adapter import NvidiaNemotronAdapter

    groq_v = GroqAdapter().validate_key()
    nvidia_c_v = NvidiaLlamaAdapter().validate_key()
    nvidia_a_v = NvidiaNemotronAdapter().validate_key()

    print(f"Groq API Key Status: {groq_v.get('status')} {'[Valid]' if groq_v.get('valid') else '[ERROR: ' + str(groq_v.get('error')) + ']'}")
    print(f"Nvidia Coding API Key Status: {nvidia_c_v.get('status')} {'[Valid]' if nvidia_c_v.get('valid') else '[ERROR: ' + str(nvidia_c_v.get('error')) + ']'}")
    print(f"Nvidia Automation API Key Status: {nvidia_a_v.get('status')} {'[Valid]' if nvidia_a_v.get('valid') else '[ERROR: ' + str(nvidia_a_v.get('error')) + ']'}")

def handle_promote():
    print("\n--- Running Memory Promotion Job (ShortTerm -> LongTerm) ---")
    promoter = MemoryPromoter()
    res = promoter.run_promotion()
    print(f"Result: {res}")

def handle_server():
    from server import run_server
    run_server()

def main():
    parser = argparse.ArgumentParser(description="Jon — Local-First Hybrid AI Assistant")
    parser.add_argument("--interactive", "-i", action="store_true", help="Start interactive CLI session")
    parser.add_argument("--voice", "-v", action="store_true", help="Start continuous voice mode")
    parser.add_argument("--query", "-q", type=str, help="Process a single text query")
    parser.add_argument("--force-offline", action="store_true", help="Force offline execution mode")
    parser.add_argument("command", nargs="?", choices=["health", "promote", "server"], help="Optional command")

    args = parser.parse_args()

    if args.command == "health":
        handle_health()
        return
    elif args.command == "promote":
        handle_promote()
        return
    elif args.command == "server":
        handle_server()
        return

    orchestrator = JonOrchestrator()
    input_handler = InputHandler()

    if args.query:
        print_banner()
        req = input_handler.process_text_input(args.query)
        orchestrator.process_request(req, force_offline=args.force_offline)
        return

    if args.voice:
        print_banner()
        print("Starting voice mode... Say 'Jon' or 'Hey Jon' followed by your command.")
        stt = SpeechToText()
        if not stt.is_available():
            err_msg = f" ({stt.init_error})" if stt.init_error else ""
            print(f"Error: SpeechRecognition package or Microphone non-functional{err_msg}. Falling back to text.")
            args.interactive = True
        else:
            print("\n[Jon Voice Listening Mode Active -- Speak 'Hey Jon ...']")
            while True:
                try:
                    spoken_text = stt.listen_and_transcribe()
                    if spoken_text:
                        print(f"[User Spoke: '{spoken_text}']")
                        v_req = input_handler.process_voice_input(spoken_text)
                        if v_req:
                            orchestrator.process_request(v_req, force_offline=args.force_offline, speak_output=True)
                        else:
                            print("[Wake word 'Jon' not detected. Ignoring input.]")
                except KeyboardInterrupt:
                    print("\nExiting Jon Voice Mode.")
                    break
                except Exception as loop_err:
                    print(f"[Voice loop error: {loop_err}]")
                    time.sleep(1)
            return

    # Default to interactive mode if no flags passed
    print_banner()
    print("Interactive session started. Type 'exit' or 'quit' to end.\n")

    while True:
        try:
            user_str = input("You > ").strip()
            if not user_str:
                continue
            if user_str.lower() in ["exit", "quit"]:
                print("Goodbye!")
                break

            req = input_handler.process_text_input(user_str)
            orchestrator.process_request(req, force_offline=args.force_offline)
            print("-" * 50)
        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break

if __name__ == "__main__":
    main()
