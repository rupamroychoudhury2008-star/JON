import sys
from typing import Optional
from config.settings import settings

class SpeechToText:
    """Offline/Online Speech-To-Text engine handler using SpeechRecognition."""

    def __init__(self):
        self.recognizer = None
        self.sr = None
        self.init_error = None
        try:
            import speech_recognition as sr
            self.sr = sr
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 300
            self.recognizer.dynamic_energy_threshold = True
            self.recognizer.pause_threshold = settings.stt_pause_threshold
            # Test PyAudio Microphone availability
            _ = sr.Microphone()
        except Exception as e:
            self.recognizer = None
            self.sr = None
            self.init_error = str(e)

    def is_available(self) -> bool:
        return self.recognizer is not None and self.sr is not None

    def listen_and_transcribe(self, timeout: Optional[int] = None, phrase_time_limit: Optional[int] = None) -> Optional[str]:
        """Listens from microphone and transcribes audio to text."""
        if not self.is_available():
            return None

        effective_timeout = timeout if timeout is not None else settings.stt_timeout
        effective_limit = phrase_time_limit if phrase_time_limit is not None else settings.stt_phrase_time_limit

        try:
            with self.sr.Microphone() as source:
                print(f"\n[Jon Listening (max phrase {effective_limit}s)... Speak now ('Hey Jon ...')]")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.3)
                audio = self.recognizer.listen(source, timeout=effective_timeout, phrase_time_limit=effective_limit)
                print("[Processing speech...]")
                
                text = None
                try:
                    text = self.recognizer.recognize_google(audio)
                except self.sr.UnknownValueError:
                    print("[STT: Audio recorded but speech was not recognized clearly]")
                    text = None
                except self.sr.RequestError as req_err:
                    print(f"[STT Google API Request Error: {req_err}]")
                    # Try offline Whisper if available
                    try:
                        import whisper  # Check if whisper module is installed
                        print("[STT: Falling back to local Whisper transcription...]")
                        text = self.recognizer.recognize_whisper(audio)
                    except (ImportError, Exception) as w_err:
                        print(f"[STT Whisper Fallback unavailable: {w_err}]")
                        text = None
                except Exception as g_err:
                    print(f"[STT Error: {g_err}]")
                    text = None

                if text:
                    print(f"[Transcribed speech: '{text}']")
                return text
        except self.sr.WaitTimeoutError:
            print("[STT: Silence timeout - no speech detected in timeframe]")
            return None
        except Exception as e:
            print(f"[STT Microphone / Audio Error: {str(e)}]")
            return None
