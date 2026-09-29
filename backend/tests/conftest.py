import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
import app.models.user
import app.models.trial
import app.models.protocol
import app.models.participant
import app.models.governance
import app.models.audit
from app.main import app
from app.seed import seed_database

# Use an in-memory or dedicated test sqlite db for lightning-fast hermetic test runs
TEST_DATABASE_URL = "sqlite:///./test_ayu_trial_fabric.db"

test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.guardrails.ai_guardrails import get_readonly_db

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_readonly_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Run seeder on test DB
    from unittest.mock import patch
    with patch("app.seed.engine", test_engine), patch("app.seed.SessionLocal", TestingSessionLocal):
        seed_database()
    
    yield
    
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
