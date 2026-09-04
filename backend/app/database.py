import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("ayu_trial_fabric.db")

Base = declarative_base()

def get_engine():
    """
    PostgreSQL-first engine with connection recycling.
    If PostgreSQL is unreachable in local dev without docker, falls back to SQLite seamlessly.
    """
    database_url = settings.DATABASE_URL
    try:
        if database_url.startswith("sqlite"):
            engine = create_engine(database_url, connect_args={"check_same_thread": False})
        else:
            # PostgreSQL connection
            engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=10,
                max_overflow=20
            )
            # Test connection probe
            with engine.connect() as conn:
                pass
        return engine
    except Exception as exc:
        logger.warning(
            f"Could not connect to primary database at {database_url} ({exc}). "
            f"Using documented local offline fallback: {settings.SQLITE_FALLBACK_URL}"
        )
        return create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency for request-scoped database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
