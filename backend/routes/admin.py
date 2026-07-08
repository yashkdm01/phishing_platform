from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from models import models

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent the master admin from being deleted accidentally
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete an administrator account")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.delete("/history/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(models.ScanHistory).filter(models.ScanHistory.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(scan)
    db.commit()
    return {"message": "Log cleared successfully"}
