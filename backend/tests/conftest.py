"""Pytest configuration and fixtures"""
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.services.user import UserService
from app.schemas.user import UserCreate

# Create in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database session"""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db: Session) -> dict:
    """Create a test user"""
    user_data = UserCreate(
        email="test@example.com",
        name="Test User",
        password="testpassword123"
    )
    user = UserService.create_user(db, user_data)
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "password": "testpassword123"
    }


@pytest.fixture
def test_user_token(test_user: dict) -> str:
    """Create an access token for test user"""
    return create_access_token(data={"sub": test_user["id"]})


@pytest.fixture
def auth_headers(test_user_token: str) -> dict:
    """Create authorization headers for test user"""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def second_test_user(db: Session) -> dict:
    """Create a second test user"""
    user_data = UserCreate(
        email="test2@example.com",
        name="Test User 2",
        password="testpassword123"
    )
    user = UserService.create_user(db, user_data)
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "password": "testpassword123"
    }
