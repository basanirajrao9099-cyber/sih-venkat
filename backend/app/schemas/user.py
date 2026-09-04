from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.models.user import RoleName


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: "UserProfileSchema"


class UserProfileSchema(BaseModel):
    id: str
    name: str
    email: str
    role: RoleName
    institution: Optional[str] = None
    avatar: Optional[str] = None
    permissions: List[str] = []

    class Config:
        from_attributes = True


TokenResponse.model_rebuild()
