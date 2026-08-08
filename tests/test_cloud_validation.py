import unittest
from cloud_gateway.groq_adapter import GroqAdapter
from cloud_gateway.nvidia_llama_adapter import NvidiaLlamaAdapter
from cloud_gateway.nvidia_nemotron_adapter import NvidiaNemotronAdapter
from cloud_gateway.gateway import CloudGateway
from router.intent_router import UserRequest

class TestCloudValidation(unittest.TestCase):
    def test_groq_validate_key(self):
        adapter = GroqAdapter()
        res = adapter.validate_key()
        self.assertIn("status", res)
        self.assertIn("valid", res)

    def test_nvidia_llama_validate_key(self):
        adapter = NvidiaLlamaAdapter()
        res = adapter.validate_key()
        self.assertIn("status", res)
        self.assertIn("valid", res)

    def test_nvidia_nemotron_validate_key(self):
        adapter = NvidiaNemotronAdapter()
        res = adapter.validate_key()
        self.assertIn("status", res)
        self.assertIn("valid", res)

    def test_cloud_gateway_routing(self):
        cg = CloudGateway()
        req = UserRequest(text="What is 2+2?")
        res = cg.route_to_cloud("chat/research/planning", req)
        self.assertIn("provider", res)
        self.assertIn("content", res)

if __name__ == "__main__":
    unittest.main()
