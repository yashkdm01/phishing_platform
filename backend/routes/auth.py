import os
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

    # Determine Role based on the Master Secret
    user_role = "user"
    master_secret = os.getenv("ADMIN_SETUP_SECRET")
    
    # Safely check if the frontend passed an admin_secret
    provided_secret = getattr(user, "admin_secret", None)
    
    if provided_secret:
        if provided_secret == master_secret:
            user_role = "admin"
        else:
            raise HTTPException(status_code=403, detail="Invalid Master Secret. Security incident logged.")

    # Scramble the password so we never store plain text
    hashed_pw = security.get_password_hash(user.password)
    
    # Create the new user and save them to our database (assigning the role!)
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        password=hashed_pw,
        role=user_role 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": f"User successfully created as {user_role.upper()}!"}

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

    # They passed the check! Generate their VIP token and inject their role.
    # We use getattr as a safety net just in case older users don't have a role column yet
    user_role = getattr(db_user, "role", "user")
    
    access_token = security.create_access_token(
        data={"sub": db_user.email, "role": user_role}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
