import re
import time
import uuid
from typing import Optional
from router.intent_router import UserRequest
from config.settings import settings

DEFAULT_WAKE_PATTERNS = [
    r"\bhey\s+jon\b", r"\bhey\s+john\b", r"\bhi\s+jon\b", r"\bhi\s+john\b",
    r"\bok\s+jon\b", r"\bokay\s+jon\b", r"\bok\s+john\b", r"\bokay\s+john\b",
    r"\bhello\s+jon\b", r"\bhello\s+john\b", r"\byo\s+jon\b", r"\byo\s+john\b",
    r"\bjon\b", r"\bjohn\b"
]

class InputHandler:
    """Normalizes voice and text inputs into standard UserRequest objects."""

    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or f"session_{uuid.uuid4().hex[:8]}"

    def process_text_input(self, text: str) -> UserRequest:
        return UserRequest(
            text=text.strip(),
            timestamp=time.time(),
            source="text",
            session_id=self.session_id
        )

    def process_voice_input(self, transcribed_text: str, require_wake_word: bool = True) -> Optional[UserRequest]:
        clean_text = transcribed_text.strip()
        if not clean_text:
            return None

        lower_text = clean_text.lower()

        # Combine configured wake words and default regex patterns
        configured_wakes = [w.lower().strip() for w in settings.wake_words]
        
        wake_match = False
        matched_wake_str = ""

        # Check regex patterns first
        for pat in DEFAULT_WAKE_PATTERNS:
            m = re.search(pat, lower_text)
            if m:
                wake_match = True
                matched_wake_str = m.group(0)
                break

        # Check configured wake words if not matched yet
        if not wake_match:
            for wake in configured_wakes:
                if re.search(r'\b' + re.escape(wake) + r'\b', lower_text):
                    wake_match = True
                    matched_wake_str = wake
                    break

        if require_wake_word and not wake_match:
            return None

        # Strip wake word prefix or substring if present
        stripped_text = clean_text
        if wake_match and matched_wake_str:
            # Strip if prefix
            pattern = re.compile(r'^\s*' + re.escape(matched_wake_str) + r'[,\s.:?!]*', re.IGNORECASE)
            stripped_text = pattern.sub('', clean_text).strip()

        if not stripped_text:
            stripped_text = "Hello Jon"

        return UserRequest(
            text=stripped_text,
            timestamp=time.time(),
            source="voice",
            session_id=self.session_id
        )
