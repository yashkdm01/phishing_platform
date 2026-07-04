from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class URLScanRequest(BaseModel):
    url: str

class ScanResponse(BaseModel):
    url: str
    risk_level: str
    status: str
    details: dict

# --- NEW EMAIL SCHEMAS ---

class EmailScanRequest(BaseModel):
    content: str

class EmailScanResponse(BaseModel):
    risk_level: str
    status: str
    details: dict