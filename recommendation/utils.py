import spacy
from typing import List, Dict, Any

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_md")
except:
    # Fallback to small model if medium not available
    nlp = spacy.load("en_core_web_sm")

def extract_context_keywords(text: str, max_keywords: int = 5) -> List[str]:
    """
    Extract important keywords from job context
    
    Args:
        text: Text to extract keywords from
        max_keywords: Maximum number of keywords to extract
        
    Returns:
        List of extracted keywords
    """
    doc = nlp(text)
    keywords = []
    
    # Add named entities (companies, job titles, etc.)
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART", "EVENT"]:
            keywords.append(ent.text.lower())
    
    # Add important nouns
    for token in doc:
        if token.pos_ in ["NOUN", "PROPN"] and token.text.lower() not in keywords:
            keywords.append(token.text.lower())
    
    # Filter short words and common words
    common_words = ["position", "job", "work", "role", "time", "year", "day"]
    keywords = [k for k in keywords if len(k) > 3 and k not in common_words]
    
    return keywords[:max_keywords]

def format_search_query(skill: str, context_keywords: List[str], query_type: str = "learn") -> str:
    """
    Format a search query based on skill and context
    
    Args:
        skill: Primary skill to search for
        context_keywords: Additional context keywords
        query_type: Type of query (learn, practice, interview)
        
    Returns:
        Formatted search query string
    """
    query = skill
    
    # Add top context keywords (limit to 3 for better search results)
    if context_keywords:
        query += " " + " ".join(context_keywords[:3])
    
    # Add query type specific terms
    if query_type == "learn":
        query += " tutorial guide beginner"
    elif query_type == "practice":
        query += " practice exercises examples projects"
    elif query_type == "interview":
        query += " interview questions technical preparation"
    
    return query