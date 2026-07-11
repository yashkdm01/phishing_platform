import os
import base64
import requests 
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models import models, schemas
from services.url_scanner import analyze_url
from services.email_scanner import analyze_email

router = APIRouter(prefix="/scan", tags=["Threat Detection"])

@router.post("/url", response_model=schemas.ScanResponse)
def scan_suspicious_url(request: schemas.URLScanRequest, db: Session = Depends(get_db)):
    target_url = request.url
    vt_api_key = os.getenv("VIRUSTOTAL_API_KEY")
    
    # Default variables
    risk_level = "LOW"
    result_status = "Safe. No threats detected."
    # FIX: Initialize details as a proper dictionary structure to satisfy schemas.py
    details = {"message": "Verified clean.", "engine": "default"}
    
    # 1. VirusTotal Enterprise Engine
    if vt_api_key:
        try:
            # VirusTotal requires URLs to be base64 encoded without padding
            url_id = base64.urlsafe_b64encode(target_url.encode()).decode().strip("=")
            
            response = requests.get(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": vt_api_key}
            )
            
            if response.status_code == 200:
                data = response.json()
                stats = data['data']['attributes']['last_analysis_stats']
                
                malicious_votes = stats.get('malicious', 0)
                suspicious_votes = stats.get('suspicious', 0)
                
                if malicious_votes > 0:
                    risk_level = "HIGH"
                    result_status = f"CRITICAL: Flagged by {malicious_votes} security vendors as malicious."
                elif suspicious_votes > 0:
                    risk_level = "MEDIUM"
                    result_status = f"WARNING: Flagged as suspicious by {suspicious_votes} vendors."
                else:
                    risk_level = "LOW"
                    result_status = "Verified Clean by VirusTotal global consensus."
                
                # FIX: Send back the raw `stats` dictionary directly instead of stringifying it
                details = stats
            else:
                # If URL isn't found in VT yet, fallback to your local engine
                fallback = analyze_url(target_url)
                risk_level = fallback["risk_level"]
                result_status = fallback["status"]
                # FIX: Standardize local engine string into a dictionary format
                details = {"message": fallback.get("details", "Scanned by local engine."), "engine": "local"}
                
        except Exception as e:
            print(f"VT Engine Error: {e}")
            # Fallback to local engine on API failure
            fallback = analyze_url(target_url)
            risk_level = fallback["risk_level"]
            result_status = fallback["status"]
            # FIX: Standardize local engine string into a dictionary format
            details = {"message": fallback.get("details", "Scanned by local engine."), "engine": "local_fallback"}
    else:
        # Fallback if no API key is set in Render
        fallback = analyze_url(target_url)
        risk_level = fallback["risk_level"]
        result_status = fallback["status"]
        # FIX: Standardize local engine string into a dictionary format
        details = {"message": fallback.get("details", "Scanned by local engine."), "engine": "local"}

    if risk_level == "ERROR":
        raise HTTPException(status_code=400, detail=result_status)

    # 2. Save to Database for the Dashboard
    new_scan = models.ScanHistory(
        user_id=None, 
        content=target_url,
        result=result_status,
        risk_level=risk_level
    )
    db.add(new_scan)
    db.commit()

    # 3. Return matching your exact Schema
    return {
        "url": target_url,
        "risk_level": risk_level,
        "status": result_status,
        "details": details
    }

# --- EMAIL SCANNER ROUTE ---

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
        "details": {"message": analysis_result["details"]} # FIX: Widen to dict formatting compatibility
    }
