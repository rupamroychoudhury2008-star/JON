import unittest
import tempfile
import shutil
from pathlib import Path
from tools.executor import ToolExecutor
from memory.obsidian_vault import ObsidianVault

class TestToolExecution(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.vault = ObsidianVault(vault_path=self.temp_dir)
        self.executor = ToolExecutor(vault=self.vault)

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def test_file_write_and_read_tool(self):
        file_path = str(self.temp_dir / "test_file.txt")
        write_res = self.executor.execute_tool("write_file", {"path": file_path, "content": "Hello from Jon tools!"})
        self.assertTrue(write_res.success)
        self.assertIn("Successfully wrote", write_res.message)

        read_res = self.executor.execute_tool("read_file", {"path": file_path})
        self.assertTrue(read_res.success)
        self.assertIn("Hello from Jon tools!", read_res.message)

    def test_guardrail_blocking_non_interactive(self):
        block_res = self.executor.execute_tool(
            "run_command",
            {"cmd": "rm -rf /"},
            interactive=False
        )
        self.assertFalse(block_res.success)
        self.assertIn("Execution blocked by non-interactive guardrail policy", block_res.message)

if __name__ == "__main__":
    unittest.main()
