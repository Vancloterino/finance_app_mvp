from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Configure connection pool for production PostgreSQL databases
# For SQLite (testing), these settings are ignored
engine = create_engine(
    settings.DATABASE_URL,
    # Connection pool configuration
    pool_size=10,              # Minimum number of connections in pool
    max_overflow=20,           # Maximum connections beyond pool_size
    pool_timeout=30,           # Seconds to wait for connection before timing out
    pool_recycle=3600,         # Recycle connections after 1 hour (prevents stale connections)
    pool_pre_ping=True,        # Check connection health before using (prevents stale connections)
    # Connection arguments
    echo=False,                # Set to True to log all SQL statements (debugging)
    future=True,               # Use SQLAlchemy 2.0 style
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()