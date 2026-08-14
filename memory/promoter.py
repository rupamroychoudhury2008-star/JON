import os
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from .obsidian_vault import ObsidianVault
from .memory_manager import MemoryManager
from cloud_gateway.gateway import CloudGateway
from router.intent_router import UserRequest
from config.settings import settings

PROMOTION_SYSTEM_PROMPT = """You are the Memory Consolidation Engine for Jon.
Your job is to analyze short-term interaction notes and extract durable long-term facts, project details, or user preferences.

Categorize extracted insights into:
- facts: General knowledge, preferences, key decisions.
- projects: Project names, goals, status, technical decisions.
- people: People names, details, relationships, notes.

Outputs should be clear markdown bullet points per category.
If no durable facts are found, return "NO_DURABLE_FACTS".
"""

class MemoryPromoter:
    def __init__(self, memory_manager: Optional[MemoryManager] = None, gateway: Optional[CloudGateway] = None):
        self.memory_manager = memory_manager or MemoryManager()
        self.vault = self.memory_manager.vault
        self.gateway = gateway or CloudGateway()

    def run_promotion(self) -> Dict[str, Any]:
        """
        Scans all files in /ShortTerm/, extracts durable information, and writes to /LongTerm/.
        """
        short_term_files = list(self.vault.short_term_dir.glob("*.md"))
        if not short_term_files:
            return {"status": "success", "processed_files": 0, "promoted_facts": 0}

        promoted_count = 0
        for file in short_term_files:
            try:
                with open(file, "r", encoding="utf-8") as f:
                    content = f.read()

                prompt = f"Analyze these short-term interaction notes and extract durable facts:\n\n{content}"
                req = UserRequest(text=prompt)
                res = self.gateway.route_to_cloud(intent="chat/research/planning", request=req, context=PROMOTION_SYSTEM_PROMPT)
                summary = res.get("content", "")

                if "NO_DURABLE_FACTS" not in summary and len(summary) > 20:
                    note_title = f"summary_{file.stem}"
                    self.memory_manager.add_long_term_fact(
                        category="facts",
                        title=note_title,
                        content=summary,
                        tags=["promoted", file.stem]
                    )
                    promoted_count += 1

            except Exception as e:
                continue

        return {
            "status": "completed",
            "processed_files": len(short_term_files),
            "promoted_facts": promoted_count
        }
