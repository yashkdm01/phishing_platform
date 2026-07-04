from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from models import models, schemas
from utils import security

# We group these routes under the "Authentication" tag for our documentation
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # First, check if someone is already using this email
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # Scramble the password so we never store plain text
    hashed_pw = security.get_password_hash(user.password)
    
    # Create the new user and save them to our SQLite database
    new_user = models.User(name=user.name, email=user.email, password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User successfully created!"}

@router.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # Search for the user by email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    # If the user doesn't exist, or the password doesn't match the hash, boot them out
    if not db_user or not security.verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # They passed the check! Generate their VIP token.
    access_token = security.create_access_token(data={"sub": db_user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}