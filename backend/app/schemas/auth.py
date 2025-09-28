from typing import Optional
from pydantic import BaseModel


class TokenData(BaseModel):
    user_id: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class LoginRequest(BaseModel):
    auth_id: str  # From external auth provider (Cognito, etc.)
    email: Optional[str] = None
    name: Optional[str] = None