"""
Lightweight text analysis using pure Python keyword matching.
No external NLP libraries required.
"""

import re
import string

# Common English stop words to exclude from keywords
STOP_WORDS = {
    "the", "a", "an", "is", "in", "on", "at", "to", "and", "or", "of",
    "for", "with", "it", "this", "that", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "need",
    "i", "we", "you", "he", "she", "they", "my", "our", "your", "their",
    "its", "from", "by", "as", "but", "not", "no", "so", "if", "then",
    "there", "here", "when", "where", "who", "what", "how", "all", "some",
    "any", "each", "more", "also", "very", "just", "about", "up", "out",
}

# Keywords that map to each category
CATEGORY_KEYWORDS: dict[str, set[str]] = {
    "food": {
        "food", "hunger", "hungry", "starving", "starvation", "meal", "meals",
        "water", "nutrition", "eat", "eating", "drink", "drinking", "feed",
        "feeding", "famine", "crops", "harvest", "supplies",
    },
    "shelter": {
        "shelter", "homeless", "homelessness", "housing", "house", "roof",
        "tent", "flood", "flooded", "flooding", "displaced", "displacement",
        "evacuation", "evacuate", "building", "collapsed", "destroyed",
        "accommodation", "camp",
    },
    "medical": {
        "medical", "medicine", "injury", "injured", "sick", "illness",
        "hospital", "health", "wound", "wounded", "pain", "disease",
        "infection", "treatment", "doctor", "nurse", "ambulance", "bleeding",
        "fever", "epidemic", "outbreak",
    },
    "education": {
        "school", "education", "children", "learning", "teacher", "class",
        "classroom", "student", "students", "books", "literacy", "training",
        "skills", "knowledge", "university", "college",
    },
}

# Words that indicate high severity
SEVERITY_WORDS = {
    "urgent", "urgently", "critical", "critically", "emergency", "danger",
    "dangerous", "immediate", "immediately", "severe", "severely",
    "life-threatening", "crisis", "desperate", "desperately", "dying",
    "death", "fatal", "catastrophic", "disaster", "sos", "help",
}


def _tokenize(text: str) -> list[str]:
    """Lowercase, strip punctuation, and split into tokens."""
    text = text.lower()
    # Replace hyphens with space so "life-threatening" → ["life", "threatening"]
    # but keep the original for severity matching
    text_no_punct = re.sub(r"[^\w\s-]", "", text)
    tokens = text_no_punct.split()
    return tokens


def extract_keywords(text: str) -> list[str]:
    """
    Return significant lowercase words from text, excluding stop words
    and single-character tokens. Preserves insertion order, deduplicates.
    """
    tokens = _tokenize(text)
    seen: set[str] = set()
    keywords: list[str] = []
    for token in tokens:
        # Strip any remaining punctuation from token edges
        clean = token.strip(string.punctuation)
        if clean and len(clean) > 1 and clean not in STOP_WORDS and clean not in seen:
            seen.add(clean)
            keywords.append(clean)
    return keywords


def categorize(keywords: list[str]) -> str:
    """
    Return the category whose keyword set has the most overlap with the
    provided keywords list. Returns "other" if no category matches.
    """
    keyword_set = set(keywords)
    scores: dict[str, int] = {
        cat: len(keyword_set & words)
        for cat, words in CATEGORY_KEYWORDS.items()
    }
    best_cat = max(scores, key=lambda c: scores[c])
    return best_cat if scores[best_cat] > 0 else "other"


def severity_score(text: str) -> float:
    """
    Return a float in [0.0, 1.0] representing how severe the text is.
    Computed as: min(matched_severity_words / MAX_SEVERITY_WORDS, 1.0)
    where MAX_SEVERITY_WORDS is the cap used for normalisation (5).
    """
    MAX_SEVERITY_WORDS = 5
    tokens = set(_tokenize(text))
    # Also check the original text for hyphenated terms like "life-threatening"
    original_lower = text.lower()
    matched = sum(
        1 for word in SEVERITY_WORDS
        if word in tokens or word in original_lower
    )
    return round(min(matched / MAX_SEVERITY_WORDS, 1.0), 4)
