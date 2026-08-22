import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Detect Vercel environment or read-only filesystem
if os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or not os.access(".", os.W_OK):
    db_path = os.path.join(tempfile.gettempdir(), "samai.db")
    DATABASE_URL = f"sqlite:///{db_path}"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./samai.db")

# Fix for Railway PostgreSQL URL format (postgres:// to postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"Database Session Error: {e}")
    finally:
        try:
            db.close()
        except Exception:
            pass
