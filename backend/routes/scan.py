from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models import models, schemas
from services.url_scanner import analyze_url
from services.email_scanner import analyze_email

router = APIRouter(prefix="/scan", tags=["Threat Detection"])

@router.post("/url", response_model=schemas.ScanResponse)
def scan_suspicious_url(request: schemas.URLScanRequest, db: Session = Depends(get_db)):
    analysis_result = analyze_url(request.url)
    
    if analysis_result["risk_level"] == "ERROR":
        raise HTTPException(status_code=400, detail=analysis_result["status"])

    new_scan = models.ScanHistory(
        user_id=None, 
        content=request.url,
        result=analysis_result["status"],
        risk_level=analysis_result["risk_level"]
    )
    db.add(new_scan)
    db.commit()

    return {
        "url": request.url,
        "risk_level": analysis_result["risk_level"],
        "status": analysis_result["status"],
        "details": analysis_result["details"]
    }

# --- NEW EMAIL SCANNER ROUTE ---

@router.post("/email", response_model=schemas.EmailScanResponse)
def scan_suspicious_email(request: schemas.EmailScanRequest, db: Session = Depends(get_db)):
    # 1. Send the email content to our NLP engine
    analysis_result = analyze_email(request.content)
    
    # 2. Save the result to the database for the dashboard
    new_scan = models.ScanHistory(
        user_id=None, 
        content=request.content[:100] + "...", # Only save the first 100 chars to save space
        result=analysis_result["status"],
        risk_level=analysis_result["risk_level"]
    )
    db.add(new_scan)
    db.commit()

    # 3. Return the report
    return {
        "risk_level": analysis_result["risk_level"],
        "status": analysis_result["status"],
        "details": analysis_result["details"]
    }