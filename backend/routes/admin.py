from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from models import models

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# ==========================================
# NEW: GLOBAL SOC TELEMETRY ROUTE
# ==========================================
@router.get("/telemetry")
def get_global_telemetry(db: Session = Depends(get_db)):
    # Fetch ALL scans from the entire database, newest first
    history = db.query(models.ScanHistory).order_by(models.ScanHistory.id.desc()).all()
    
    total = len(history)
    blocked = sum(1 for log in history if log.risk_level in ["HIGH", "MEDIUM"])
    
    return {
        "total_scans": total,
        "threats_blocked": blocked,
        "history": history
    }

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Security: Prevent the master admin from being deleted
    if getattr(user, "role", "user") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete an administrator account")
        
    try:
        # Safely delete associated logs first to prevent database locks
        db.query(models.ScanHistory).filter(models.ScanHistory.user_id == user_id).delete(synchronize_session=False)
        
        db.delete(user)
        db.commit()
        return {"message": "User and associated data deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database lock error. Please try again.")

@router.delete("/history/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(models.ScanHistory).filter(models.ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(scan)
    db.commit()
    return {"message": "Log cleared successfully"}
