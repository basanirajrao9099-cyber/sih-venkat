import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("ayu_trial_fabric.db")

Base = declarative_base()

def get_engine():
    """
    PostgreSQL-first engine with connection recycling.
    Normalizes Render postgres:// URLs to postgresql:// and falls back to SQLite if unreachable.
    """
    database_url = settings.DATABASE_URL
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

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

def ensure_sqlite_schema(engine_instance):
    """Safely ensure new CTRI and governance columns exist in SQLite tables if running SQLite."""
    try:
        if "sqlite" in str(engine_instance.url):
            from sqlalchemy import inspect, text
            inspector = inspect(engine_instance)
            tables = inspector.get_table_names()
            with engine_instance.connect() as conn:
                if "trials" in tables:
                    cols = [c["name"] for c in inspector.get_columns("trials")]
                    trial_new = [
                        ("scientific_title", "VARCHAR"),
                        ("study_type", "VARCHAR"),
                        ("study_design", "VARCHAR"),
                        ("health_condition", "VARCHAR"),
                        ("intervention", "VARCHAR"),
                        ("comparator", "VARCHAR"),
                        ("primary_sponsor", "VARCHAR"),
                        ("secondary_sponsor", "VARCHAR"),
                        ("recruitment_status", "VARCHAR"),
                        ("first_enrollment_date", "VARCHAR"),
                        ("study_duration", "VARCHAR"),
                        ("target_sample_size", "INTEGER"),
                        ("final_enrollment", "INTEGER"),
                        ("country", "VARCHAR"),
                        ("source_registry", "VARCHAR"),
                        ("source_url", "VARCHAR"),
                        ("source_fetched_at", "VARCHAR"),
                        ("source_hash", "VARCHAR"),
                        ("source_mode", "VARCHAR"),
                    ]
                    for name, col_type in trial_new:
                        if name not in cols:
                            conn.execute(text(f"ALTER TABLE trials ADD COLUMN {name} {col_type}"))
                if "sites" in tables:
                    cols = [c["name"] for c in inspector.get_columns("sites")]
                    site_new = [
                        ("address", "VARCHAR"),
                        ("country", "VARCHAR"),
                        ("ethics_committee", "VARCHAR"),
                        ("ethics_approval_status", "VARCHAR"),
                        ("recruitment_status", "VARCHAR"),
                        ("source_registry", "VARCHAR"),
                        ("source_url", "VARCHAR"),
                        ("source_fetched_at", "VARCHAR"),
                    ]
                    for name, col_type in site_new:
                        if name not in cols:
                            conn.execute(text(f"ALTER TABLE sites ADD COLUMN {name} {col_type}"))
                if "changesets" in tables:
                    cols = [c["name"] for c in inspector.get_columns("changesets")]
                    if "lifecycle_state" not in cols:
                        conn.execute(text("ALTER TABLE changesets ADD COLUMN lifecycle_state VARCHAR"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Schema check notice: {e}")


engine = get_engine()
ensure_sqlite_schema(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency for request-scoped database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
