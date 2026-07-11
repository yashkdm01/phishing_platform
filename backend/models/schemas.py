from pydantic import BaseModel
from typing import Dict, Any, Optional

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class AdminCreate(BaseModel):
    user: UserCreate
    admin_secret: str

class Token(BaseModel):
    access_token: str
    token_type: str

class URLScanRequest(BaseModel):
    url: str

class ScanResponse(BaseModel):
    url: str
    risk_level: str
    status: str
    details: Dict[str, Any]

class EmailScanRequest(BaseModel):
    content: str

class EmailScanResponse(BaseModel):
    risk_level: str
    status: str
    details: Dict[str, Any]
