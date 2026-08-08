import unittest
from cloud_gateway.groq_adapter import GroqAdapter
from cloud_gateway.nvidia_llama_adapter import NvidiaLlamaAdapter
from cloud_gateway.nvidia_nemotron_adapter import NvidiaNemotronAdapter

class TestCloudGateway(unittest.TestCase):
    def test_adapter_availability_checks(self):
        groq = GroqAdapter(api_key="")
        self.assertFalse(groq.is_available())

        nv_llama = NvidiaLlamaAdapter(api_key="")
        self.assertFalse(nv_llama.is_available())

        nv_nemo = NvidiaNemotronAdapter(api_key="")
        self.assertFalse(nv_nemo.is_available())

if __name__ == "__main__":
    unittest.main()
