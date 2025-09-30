from typing import Optional
from pydantic import BaseModel, EmailStr


class TokenData(BaseModel):
    user_id: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: dict


class LoginRequest(BaseModel):
    auth_id: str  # From external auth provider (Cognito, etc.)
    email: Optional[str] = None
    name: Optional[str] = None


class EmailPasswordLogin(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str