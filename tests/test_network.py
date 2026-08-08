import unittest
from router.network_detector import is_network_available

class TestNetworkDetector(unittest.TestCase):
    def test_is_network_available(self):
        res = is_network_available()
        self.assertIsInstance(res, bool)

if __name__ == "__main__":
    unittest.main()
