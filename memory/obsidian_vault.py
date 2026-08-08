import os
import re
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import yaml
from config.settings import settings

class VaultNote:
    def __init__(self, path: Path, frontmatter: Dict[str, Any], content: str):
        self.path = path
        self.frontmatter = frontmatter
        self.content = content

class ObsidianVault:
    def __init__(self, vault_path: Optional[Path] = None):
        self.vault_path = Path(vault_path or settings.vault_path).resolve()
        self.short_term_dir = self.vault_path / "ShortTerm"
        self.long_term_facts_dir = self.vault_path / "LongTerm" / "facts"
        self.long_term_projects_dir = self.vault_path / "LongTerm" / "projects"
        self.long_term_people_dir = self.vault_path / "LongTerm" / "people"
        self.logs_tool_calls_dir = self.vault_path / "Logs" / "tool-calls"
        self.tasks_dir = self.vault_path / "Tasks"
        
        self.initialize_vault()

    def initialize_vault(self):
        """Creates the required folder hierarchy if missing."""
        directories = [
            self.short_term_dir,
            self.long_term_facts_dir,
            self.long_term_projects_dir,
            self.long_term_people_dir,
            self.logs_tool_calls_dir,
            self.tasks_dir
        ]
        for d in directories:
            d.mkdir(parents=True, exist_ok=True)
            
        inbox = self.tasks_dir / "inbox.md"
        if not inbox.exists():
            self.write_note(
                path=inbox,
                frontmatter={
                    "session_id": "system",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "type": "tasks",
                    "tags": ["tasks", "inbox"],
                    "importance": 1
                },
                content="# Task Inbox\n\n- [ ] Task inbox created.\n"
            )

    @staticmethod
    def format_frontmatter(metadata: Dict[str, Any]) -> str:
        yaml_str = yaml.dump(metadata, sort_keys=False, allow_unicode=True).strip()
        return f"---\n{yaml_str}\n---\n\n"

    @staticmethod
    def parse_note(raw_text: str) -> tuple[Dict[str, Any], str]:
        """Parses YAML frontmatter and body from markdown text."""
        pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
        match = re.match(pattern, raw_text, re.DOTALL)
        if match:
            fm_text, body = match.group(1), match.group(2)
            try:
                frontmatter = yaml.safe_load(fm_text) or {}
            except Exception:
                frontmatter = {}
            return frontmatter, body.strip()
        return {}, raw_text.strip()

    def write_note(self, path: Path, frontmatter: Dict[str, Any], content: str) -> Path:
        """Writes or overwrites a markdown note with frontmatter."""
        path.parent.mkdir(parents=True, exist_ok=True)
        full_content = self.format_frontmatter(frontmatter) + content
        with open(path, "w", encoding="utf-8") as f:
            f.write(full_content)
        return path

    def append_to_today_short_term(self, session_id: str, request_text: str, path_handled: str, response_text: str, tags: List[str] = None):
        """Appends an interaction entry to today's note in /ShortTerm/YYYY-MM-DD.md."""
        today_str = datetime.date.today().isoformat()
        note_path = self.short_term_dir / f"{today_str}.md"
        now_str = datetime.datetime.now().isoformat()
        tags = tags or ["interaction"]

        interaction_entry = (
            f"### Interaction at {now_str}\n"
            f"- **Session ID**: `{session_id}`\n"
            f"- **Path Handled**: `{path_handled}`\n"
            f"- **User Request**: {request_text}\n"
            f"- **Response**: {response_text}\n\n"
        )

        if not note_path.exists():
            frontmatter = {
                "session_id": session_id,
                "timestamp": now_str,
                "type": "short_term",
                "tags": tags,
                "importance": 2
            }
            content = f"# Short-Term Memory — {today_str}\n\n" + interaction_entry
            self.write_note(note_path, frontmatter, content)
        else:
            with open(note_path, "a", encoding="utf-8") as f:
                f.write(interaction_entry)

    def log_tool_call(self, tool_name: str, args: Dict[str, Any], result: str, session_id: str = "default_session"):
        """Logs tool calls under /Logs/tool-calls/YYYY-MM-DD.md."""
        today_str = datetime.date.today().isoformat()
        log_path = self.logs_tool_calls_dir / f"{today_str}.md"
        now_str = datetime.datetime.now().isoformat()

        entry = (
            f"#### [{now_str}] Tool: `{tool_name}`\n"
            f"- **Arguments**: `{args}`\n"
            f"- **Result**: {result}\n\n"
        )

        if not log_path.exists():
            frontmatter = {
                "session_id": session_id,
                "timestamp": now_str,
                "type": "log",
                "tags": ["tool_call", tool_name],
                "importance": 1
            }
            content = f"# Tool Execution Logs — {today_str}\n\n" + entry
            self.write_note(log_path, frontmatter, content)
        else:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(entry)

    def read_all_notes(self) -> List[VaultNote]:
        """Reads all notes in the vault."""
        notes = []
        for root, _, files in os.walk(self.vault_path):
            for file in files:
                if file.endswith(".md"):
                    full_path = Path(root) / file
                    try:
                        with open(full_path, "r", encoding="utf-8") as f:
                            raw = f.read()
                        fm, body = self.parse_note(raw)
                        notes.append(VaultNote(full_path, fm, body))
                    except Exception:
                        continue
        return notes
