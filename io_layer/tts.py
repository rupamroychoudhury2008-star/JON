import threading
from typing import Optional
from config.settings import settings

class TextToSpeech:
    """Local Text-To-Speech engine using pyttsx3."""

    def __init__(self):
        try:
            import pyttsx3
            self.pyttsx3 = pyttsx3
        except Exception:
            self.pyttsx3 = None

    def is_available(self) -> bool:
        return self.pyttsx3 is not None

    def speak(self, text: str, async_mode: bool = False):
        """Converts text to spoken audio."""
        if not text or not text.strip():
            return

        def _speak():
            if not self.is_available():
                print(f"\n[Jon Response]: {text}")
                return
            try:
                import re
                spoken_clean = re.sub(r"[\*#`\_✅⚡🤖🗣️]", "", text).strip()
                try:
                    print(f"\n[Jon Speaking]: {spoken_clean}")
                except Exception:
                    pass
                engine = self.pyttsx3.init()
                engine.setProperty("rate", settings.tts_rate)
                engine.say(spoken_clean)
                engine.runAndWait()
                engine.stop()
            except Exception as e:
                print(f"[TTS Error: {str(e)}]")

        if async_mode:
            threading.Thread(target=_speak, daemon=True).start()
        else:
            _speak()
