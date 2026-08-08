import unittest
import tempfile
import shutil
from pathlib import Path
from memory.obsidian_vault import ObsidianVault
from memory.memory_manager import MemoryManager

class TestMemoryLayer(unittest.TestCase):
    def setUp(self):
        self.temp_dir = Path(tempfile.mkdtemp())
        self.vault = ObsidianVault(vault_path=self.temp_dir)
        self.memory = MemoryManager(vault=self.vault)

    def tearDown(self):
        shutil.rmtree(self.temp_dir)

    def test_vault_initialization(self):
        self.assertTrue((self.temp_dir / "ShortTerm").exists())
        self.assertTrue((self.temp_dir / "LongTerm" / "facts").exists())
        self.assertTrue((self.temp_dir / "Logs" / "tool-calls").exists())
        self.assertTrue((self.temp_dir / "Tasks" / "inbox.md").exists())

    def test_short_term_interaction_saving(self):
        self.memory.save_interaction(
            session_id="test_sess",
            request_text="Hello Jon",
            path_handled="Local Test",
            response_text="Hi there!",
            tags=["unit_test"]
        )
        notes = self.vault.read_all_notes()
        self.assertGreaterEqual(len(notes), 2)  # inbox.md + today's short-term note

    def test_long_term_fact_addition(self):
        fact_path = self.memory.add_long_term_fact(
            category="facts",
            title="User Favorite Language",
            content="User prefers Python for AI projects.",
            tags=["preference", "python"]
        )
        self.assertTrue(fact_path.exists())

        context = self.memory.get_relevant_context("Python preference")
        self.assertIn("User prefers Python", context)

if __name__ == "__main__":
    unittest.main()
