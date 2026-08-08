from typing import Optional, List, Dict, Any
from pathlib import Path
import datetime
from .obsidian_vault import ObsidianVault, VaultNote
from .vector_store import VaultVectorIndex

class MemoryManager:
    """Manages short-term & long-term memory operations across Obsidian vault."""

    def __init__(self, vault: Optional[ObsidianVault] = None):
        self.vault = vault or ObsidianVault()
        self.vector_index = VaultVectorIndex(self.vault)

    def get_relevant_context(self, query: str, max_notes: int = 3) -> str:
        """
        Retrieves relevant memory snippets from LongTerm notes and recent ShortTerm notes.
        Formatted as context block for LLM system prompt.
        """
        self.vector_index.build_index()
        search_results = self.vector_index.search(query, top_k=max_notes)

        if not search_results:
            return "No prior memory context found."

        context_lines = ["--- Memory Context from Obsidian Vault ---"]
        for note, score in search_results:
            rel_path = note.path.relative_to(self.vault.vault_path)
            summary_content = note.content[:300] + ("..." if len(note.content) > 300 else "")
            tags = note.frontmatter.get('tags', [])
            context_lines.append(f"Note: [{rel_path}] (Tags: {tags}, Relevance: {score:.2f})\n{summary_content}\n")

        context_lines.append("-----------------------------------------")
        return "\n".join(context_lines)

    def search_memory(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Explicit memory search API — returns structured results for the web UI.
        """
        self.vector_index.build_index()
        search_results = self.vector_index.search(query, top_k=max_results)

        results = []
        for note, score in search_results:
            rel_path = str(note.path.relative_to(self.vault.vault_path))
            results.append({
                "path": rel_path,
                "score": round(score, 3),
                "frontmatter": note.frontmatter,
                "snippet": note.content[:400] + ("..." if len(note.content) > 400 else ""),
                "full_content": note.content
            })

        return results

    def save_interaction(self, session_id: str, request_text: str, path_handled: str, response_text: str, tags: List[str] = None):
        """Saves interaction into today's short-term memory note."""
        self.vault.append_to_today_short_term(
            session_id=session_id,
            request_text=request_text,
            path_handled=path_handled,
            response_text=response_text,
            tags=tags or ["user_interaction"]
        )

    def add_long_term_fact(self, category: str, title: str, content: str, tags: List[str] = None, session_id: str = "system") -> Path:
        """
        Adds durable fact to /LongTerm/facts/, /LongTerm/projects/, or /LongTerm/people/.
        category must be one of: "facts", "projects", "people"
        """
        if category not in ["facts", "projects", "people"]:
            category = "facts"

        dir_path = self.vault.vault_path / "LongTerm" / category
        filename = f"{title.lower().replace(' ', '_')}.md"
        note_path = dir_path / filename

        frontmatter = {
            "session_id": session_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "type": "long_term",
            "tags": tags or [category, title],
            "importance": 4
        }

        return self.vault.write_note(note_path, frontmatter, f"# {title}\n\n{content}\n")

    def get_all_notes_summary(self) -> Dict[str, Any]:
        """Returns summary of all notes for the dashboard."""
        notes = self.vault.read_all_notes()
        
        short_term = []
        long_term = []
        logs = []
        tasks = []

        for note in notes:
            rel_path = str(note.path.relative_to(self.vault.vault_path))
            entry = {
                "path": rel_path,
                "frontmatter": note.frontmatter,
                "snippet": note.content[:200]
            }

            if rel_path.startswith("ShortTerm"):
                short_term.append(entry)
            elif rel_path.startswith("LongTerm"):
                long_term.append(entry)
            elif rel_path.startswith("Logs"):
                logs.append(entry)
            elif rel_path.startswith("Tasks"):
                tasks.append(entry)

        return {
            "total": len(notes),
            "short_term": {"count": len(short_term), "notes": short_term},
            "long_term": {"count": len(long_term), "notes": long_term},
            "logs": {"count": len(logs), "notes": logs},
            "tasks": {"count": len(tasks), "notes": tasks}
        }
