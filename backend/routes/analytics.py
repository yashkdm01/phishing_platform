from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from models import models

router = APIRouter(prefix="/analytics", tags=["Dashboard & Analytics"])

@router.get("/history")
def get_scan_history(db: Session = Depends(get_db)):
    # Fetch all previous scans from the database, sorted by creation date
    scans = db.query(models.ScanHistory).order_by(models.ScanHistory.id.desc()).limit(10).all()
    
    total_scans = db.query(models.ScanHistory).count()
    high_risk_count = db.query(models.ScanHistory).filter(models.ScanHistory.risk_level == "HIGH").count()
    safe_count = db.query(models.ScanHistory).filter(models.ScanHistory.risk_level == "LOW").count()

    # Flatten the keys to match your frontend requirements precisely
    return {
        "total_scans": total_scans,
        "high_risk_detected": high_risk_count,
        "safe_detected": safe_count,
        "history": scans
    }
