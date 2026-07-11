import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models import models, schemas
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 hours

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==========================================
# STANDARD USER REGISTRATION
# ==========================================
@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration Failed: This email is already registered."
        )

    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        password=hashed_password,  # FIXED: Changed to 'password'
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.email, "id": new_user.id, "role": new_user.role})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# SYSTEM OVERRIDE (ADMIN REGISTRATION)
# ==========================================
@router.post("/system-override", response_model=schemas.Token)
def register_admin(request: schemas.AdminCreate, db: Session = Depends(get_db)):
    admin_secret = os.getenv("ADMIN_SETUP_SECRET")
    if not admin_secret or request.admin_secret != admin_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Security Clearance Denied: Invalid Master Secret."
        )

    existing_user = db.query(models.User).filter(models.User.email == request.user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration Failed: An administrator with this email already exists."
        )

    hashed_password = get_password_hash(request.user.password)
    new_admin = models.User(
        name=request.user.name, 
        email=request.user.email, 
        password=hashed_password,  
        role="admin"
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    access_token = create_access_token(data={"sub": new_admin.email, "id": new_admin.id, "role": new_admin.role})
    return {"access_token": access_token, "token_type": "bearer"}


# ==========================================
# GLOBAL LOGIN ROUTE
# ==========================================
@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email, "id": user.id, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}
