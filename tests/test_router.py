import unittest
from router.intent_router import IntentRouter, UserRequest

class TestIntentRouter(unittest.TestCase):
    def setUp(self):
        self.router = IntentRouter()

    def test_force_offline_routing(self):
        req = UserRequest(text="Tell me a joke")
        decision = self.router.route(req, force_offline=True)
        self.assertFalse(decision.is_online)
        self.assertEqual(decision.intent, "offline_fallback")

    def test_rule_based_fallback_classification(self):
        intent_app = self.router._rule_based_classification("Open browser and search for news")
        self.assertEqual(intent_app, "device_automation")

        intent_code = self.router._rule_based_classification("Write a python script for sorting lists")
        self.assertEqual(intent_code, "coding")

        intent_chat = self.router._rule_based_classification("What is the capital of France?")
        self.assertEqual(intent_chat, "chat/research/planning")

if __name__ == "__main__":
    unittest.main()
