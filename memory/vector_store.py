import math
import re
import time
from typing import List, Dict, Any, Tuple, Optional
from .obsidian_vault import VaultNote, ObsidianVault

class VaultVectorIndex:
    """
    Lightweight TF-IDF semantic retrieval engine over the Obsidian vault notes.
    Includes IDF weighting and date-based recency boost.
    """

    def __init__(self, vault: ObsidianVault):
        self.vault = vault
        self.index: List[Dict[str, Any]] = []
        self._last_build_time: float = 0
        self._cache_ttl: float = 30.0  # Rebuild index at most every 30 seconds
        self._idf_cache: Dict[str, float] = {}

    def build_index(self, force: bool = False):
        """Re-indexes all markdown notes in the vault. Uses caching to avoid excessive rebuilds."""
        now = time.time()
        if not force and self.index and (now - self._last_build_time) < self._cache_ttl:
            return  # Use cached index

        notes = self.vault.read_all_notes()
        indexed = []
        all_doc_tokens = []

        for note in notes:
            # Combine title, frontmatter tags, and body text
            tags = " ".join(note.frontmatter.get("tags", [])) if isinstance(note.frontmatter.get("tags"), list) else ""
            text = f"{note.path.stem} {tags} {note.content}"
            tokens = self._tokenize(text)
            
            indexed.append({
                "note": note,
                "tokens": tokens,
                "token_set": set(tokens),
                "text": text,
                "path": str(note.path)
            })
            all_doc_tokens.append(set(tokens))

        # Build IDF (Inverse Document Frequency)
        total_docs = max(len(indexed), 1)
        idf_cache: Dict[str, float] = {}
        all_terms = set()
        for token_set in all_doc_tokens:
            all_terms.update(token_set)

        for term in all_terms:
            doc_freq = sum(1 for ts in all_doc_tokens if term in ts)
            idf_cache[term] = math.log((total_docs + 1) / (doc_freq + 1)) + 1.0

        self.index = indexed
        self._idf_cache = idf_cache
        self._last_build_time = now

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        words = re.findall(r"\w+", text.lower())
        return [w for w in words if len(w) > 2]

    def _get_recency_boost(self, note: VaultNote) -> float:
        """Boosts recent notes higher in search results."""
        timestamp_str = note.frontmatter.get("timestamp", "")
        if not timestamp_str:
            return 1.0
        try:
            from datetime import datetime
            note_time = datetime.fromisoformat(str(timestamp_str))
            now = datetime.now()
            age_hours = max((now - note_time).total_seconds() / 3600, 1)
            # Decay: notes from last 24h get full boost, older notes decay
            if age_hours <= 24:
                return 1.5
            elif age_hours <= 168:  # 1 week
                return 1.2
            else:
                return 1.0
        except Exception:
            return 1.0

    def search(self, query: str, top_k: int = 3) -> List[Tuple[VaultNote, float]]:
        """
        Searches the index for notes relevant to query using TF-IDF scoring.
        Returns top_k tuples of (VaultNote, relevance_score).
        """
        if not self.index:
            self.build_index()

        query_tokens = self._tokenize(query)
        query_token_set = set(query_tokens)
        if not query_token_set:
            return []

        results = []
        for item in self.index:
            doc_token_set = item["token_set"]
            doc_tokens = item["tokens"]
            if not doc_tokens:
                continue

            # TF-IDF scoring
            score = 0.0
            for qt in query_token_set:
                if qt in doc_token_set:
                    # TF: frequency in document
                    tf = doc_tokens.count(qt) / len(doc_tokens)
                    # IDF: inverse document frequency
                    idf = self._idf_cache.get(qt, 1.0)
                    score += tf * idf

            if score > 0:
                # Tag match boost
                note_tags = item["note"].frontmatter.get("tags", [])
                if isinstance(note_tags, list):
                    for qt in query_token_set:
                        if any(qt in str(tag).lower() for tag in note_tags):
                            score *= 1.5
                            break

                # Recency boost
                score *= self._get_recency_boost(item["note"])

                # Importance boost from frontmatter
                importance = item["note"].frontmatter.get("importance", 2)
                if isinstance(importance, (int, float)) and importance >= 4:
                    score *= 1.3

                results.append((item["note"], score))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
