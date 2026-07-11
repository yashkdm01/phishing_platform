import os
import base64
import requests 
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import jwt  # Ensure python-jose is in your requirements.txt
from config.database import get_db
from models import models, schemas
from services.url_scanner import analyze_url
from services.email_scanner import analyze_email

router = APIRouter(prefix="/scan", tags=["Threat Detection"])

# Helper function to extract user ID from the frontend token
def get_user_id_from_token(authorization: str):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        secret = os.getenv("SECRET_KEY", "your_secret_key_here") # Ensure this matches your .env
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        # Extract ID (Checks for 'id' or 'sub' depending on your auth setup)
        return payload.get("id") or payload.get("sub")
    except:
        return None

@router.post("/url", response_model=schemas.ScanResponse)
def scan_suspicious_url(
    request: schemas.URLScanRequest, 
    db: Session = Depends(get_db),
    authorization: str = Header(None) # Catches the token sent by the frontend
):
    target_url = request.url
    vt_api_key = os.getenv("VIRUSTOTAL_API_KEY")
    current_user_id = get_user_id_from_token(authorization)
    
    risk_level = "LOW"
    result_status = "Safe. No threats detected."
    details = {"message": "Verified clean.", "engine": "default"}
    
    # 1. VirusTotal Enterprise Engine
    if vt_api_key:
        try:
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
                    result_status = f"CRITICAL: Flagged by {malicious_votes} security vendors."
                elif suspicious_votes > 0:
                    risk_level = "MEDIUM"
                    result_status = f"WARNING: Flagged as suspicious by {suspicious_votes} vendors."
                else:
                    risk_level = "LOW"
                    result_status = "Verified Clean by VirusTotal global consensus."
                
                details = stats
            else:
                fallback = analyze_url(target_url)
                risk_level = fallback["risk_level"]
                result_status = fallback["status"]
                details = {"message": fallback.get("details", "Scanned by local engine."), "engine": "local"}
                
        except Exception as e:
            fallback = analyze_url(target_url)
            risk_level = fallback["risk_level"]
            result_status = fallback["status"]
            details = {"message": fallback.get("details", "Scanned by local engine."), "engine": "local_fallback"}
    else:
        fallback = analyze_url(target_url)
        risk_level = fallback["risk_level"]
        result_status = fallback["status"]
        details = {"message": fallback.get("details", "Scanned by local engine."), "engine": "local"}

    if risk_level == "ERROR":
        raise HTTPException(status_code=400, detail=result_status)

    # 2. Save to Database (NOW ATTACHED TO THE USER)
    new_scan = models.ScanHistory(
        user_id=current_user_id, # <--- THE FIX: No longer anonymous
        content=target_url,
        result=result_status,
        risk_level=risk_level
    )
    db.add(new_scan)
    db.commit()

    return {
        "url": target_url,
        "risk_level": risk_level,
        "status": result_status,
        "details": details
    }

# --- EMAIL SCANNER ROUTE ---

@router.post("/email", response_model=schemas.EmailScanResponse)
def scan_suspicious_email(
    request: schemas.EmailScanRequest, 
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    current_user_id = get_user_id_from_token(authorization)
    analysis_result = analyze_email(request.content)
    
    # 2. Save the result to the database
    new_scan = models.ScanHistory(
        user_id=current_user_id, # <--- THE FIX: No longer anonymous
        content=request.content[:100] + "...", 
        result=analysis_result["status"],
        risk_level=analysis_result["risk_level"]
    )
    db.add(new_scan)
    db.commit()

    return {
        "risk_level": analysis_result["risk_level"],
        "status": analysis_result["status"],
        "details": {"message": analysis_result["details"]} 
    }
