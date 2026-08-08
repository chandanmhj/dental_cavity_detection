from pydantic import BaseModel
from typing import List, Optional

class Detection(BaseModel):
    label: str
    confidence: float
    bbox: List[int]
    area: Optional[int] = None
    tooth: Optional[int] = None
    cavity_type: Optional[str] = None
    severity: Optional[str] = None
    ai_note: Optional[str] = None

class BreakdownItem(BaseModel):
    tooth: Optional[int]
    cavity_type: Optional[str]
    severity: Optional[str]
    confidence: Optional[float]
    ai_note: Optional[str]
    bbox: Optional[List[int]]
    area: Optional[int]

class PredictionResponse(BaseModel):
    image_width: int
    image_height: int
    detections: Optional[List[Detection]] = []
    problem_points: Optional[List[str]] = []
    detection_breakdown: Optional[List[BreakdownItem]] = []
    mask_base64: Optional[str] = None
    summary: Optional[str] = None
    notes: Optional[str] = None
