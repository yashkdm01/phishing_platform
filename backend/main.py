from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.database import engine
from models import models
from routes import auth, scan
from routes import auth, scan, analytics



models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Phishing Detection Platform",
    description="Backend engine for threat analysis and URL scanning",
    version="1.0.0"
)

# CORS: Allowing both localhost and 127.0.0.1
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(analytics.router) 

@app.get("/")
def health_check():
    return {
        "status": "radhe radhe", 
        "message": "The Phishing Detection Engine is online."
    }