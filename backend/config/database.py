from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# We are using SQLite for local development so you don't need a database server running.
# This will automatically create a file called 'phishing.db' in your backend folder.
SQLALCHEMY_DATABASE_URL = "sqlite:///./phishing.db"

# SQLite requires this extra argument (check_same_thread) to work with FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        