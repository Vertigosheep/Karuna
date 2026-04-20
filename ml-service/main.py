from fastapi import FastAPI
from pydantic import BaseModel

from analyzer import extract_keywords, categorize, severity_score

app = FastAPI(title="Karuna ML Service", version="1.0.0")


# --------------------------------------------------------------------------- #
# Request / Response models
# --------------------------------------------------------------------------- #

class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    keywords: list[str]
    category: str
    severity_score: float


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest):
    """
    Analyse the provided text and return:
    - keywords: significant words extracted from the text
    - category: best-matching issue category (food/shelter/medical/education/other)
    - severity_score: float 0–1 indicating urgency level
    """
    keywords = extract_keywords(body.text)
    return AnalyzeResponse(
        keywords=keywords,
        category=categorize(keywords),
        severity_score=severity_score(body.text),
    )
