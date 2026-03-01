import logging
import re

import spacy
from spacy.language import Language
from spacy.matcher import PhraseMatcher

from app.analytics_engine.skill_catalog import SKILL_CANONICAL_MAP, SKILL_PATTERNS
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class SkillExtractor:
    def __init__(self) -> None:
        settings = get_settings()
        self.nlp = self._load_model(settings.spacy_model)
        self.matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        patterns = [self.nlp.make_doc(skill) for skill in SKILL_PATTERNS]
        self.matcher.add("SKILLS", patterns)

    @staticmethod
    def _load_model(model_name: str) -> Language:
        try:
            return spacy.load(model_name)
        except OSError:
            logger.warning(
                "spaCy model '%s' not found. Falling back to blank English pipeline.",
                model_name,
            )
            return spacy.blank("en")

    def extract(self, text: str) -> list[str]:
        normalized_text = text.lower().strip()
        if not normalized_text:
            return []

        doc = self.nlp(normalized_text)
        extracted: set[str] = set()

        for _, start, end in self.matcher(doc):
            raw = doc[start:end].text.strip().lower()
            canonical = SKILL_CANONICAL_MAP.get(raw)
            if canonical:
                extracted.add(canonical)

        # Catch tokenized variants like "node js" and "ci cd".
        for regex, canonical in (
            (r"\bnode\s*\.?\s*js\b", "node.js"),
            (r"\bci\s*/?\s*cd\b", "ci/cd"),
            (r"\bscikit\s*-?\s*learn\b", "scikit-learn"),
        ):
            if re.search(regex, normalized_text):
                extracted.add(canonical)

        return sorted(extracted)

