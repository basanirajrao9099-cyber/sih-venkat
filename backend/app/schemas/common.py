from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[List[str]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ApiErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetails
