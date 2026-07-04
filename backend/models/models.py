from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from config.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False) # This will store hashed passwords, not plain text
    role = Column(String, default="user") # Can be 'user' or 'admin'

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False) # The URL or email text that was scanned
    result = Column(String, nullable=False) # e.g., "Phishing Website"
    risk_level = Column(String, nullable=False) # e.g., "HIGH", "MEDIUM", "LOW"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String, nullable=False) # e.g., "Daily Threat Summary"
    details = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())