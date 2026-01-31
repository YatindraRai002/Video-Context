"""
Database connection and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Use absolute DB path under data/ so same DB is used regardless of cwd
_db_url = settings.database_url
if "sqlite" in _db_url and "clipcompass.db" in _db_url:
    db_path = settings.base_data_dir / "clipcompass.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    _db_url = f"sqlite:///{db_path.as_posix()}"

engine = create_engine(
    _db_url,
    connect_args={"check_same_thread": False} if "sqlite" in _db_url else {},
    echo=settings.debug
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    from app.models import video  # Import models to register them
    Base.metadata.create_all(bind=engine)
