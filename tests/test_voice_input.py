import unittest
from io_layer.input_handler import InputHandler
from io_layer.stt import SpeechToText

class TestVoiceInput(unittest.TestCase):
    def setUp(self):
        self.handler = InputHandler()

    def test_wake_word_homophones(self):
        # Transcriptions often output 'John' instead of 'Jon'
        req1 = self.handler.process_voice_input("Hey John open notepad")
        self.assertIsNotNone(req1)
        self.assertEqual(req1.text, "open notepad")
        self.assertEqual(req1.source, "voice")

        req2 = self.handler.process_voice_input("Hi Jon tell me a joke")
        self.assertIsNotNone(req2)
        self.assertEqual(req2.text, "tell me a joke")

    def test_optional_wake_word(self):
        # Manual mic button activation bypasses wake word requirement
        req = self.handler.process_voice_input("open google.com", require_wake_word=False)
        self.assertIsNotNone(req)
        self.assertEqual(req.text, "open google.com")
        self.assertEqual(req.source, "voice")

    def test_stt_availability(self):
        stt = SpeechToText()
        self.assertTrue(stt.is_available() or stt.init_error is not None)

if __name__ == "__main__":
    unittest.main()
