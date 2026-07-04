import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# We pull the secret key from our .env file. 
# This key signs our tokens so hackers can't forge them.
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# We use bcrypt, which is the industry standard for hashing passwords safely.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    # Compares the typed password against the scrambled one in the database
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Scrambles a new password before saving it
    return pwd_context.hash(password)

def create_access_token(data: dict):
    # Packages the user's data into a secure, timed token
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt