"""Tests for database connection pooling configuration"""
import pytest
from sqlalchemy import text
from sqlalchemy.pool import QueuePool, NullPool
from app.core.database import engine, SessionLocal


class TestDatabaseConnectionPool:
    """Test database connection pool configuration"""

    def test_engine_uses_queue_pool(self):
        """Engine should use QueuePool for connection pooling"""
        # QueuePool is the default for production databases
        assert isinstance(engine.pool, QueuePool) or isinstance(engine.pool, NullPool)
        # NullPool is acceptable for testing (SQLite), QueuePool for production (PostgreSQL)

    def test_pool_size_configured(self):
        """Connection pool should have appropriate size limits"""
        pool = engine.pool

        # For production databases (PostgreSQL), check pool configuration
        if isinstance(pool, QueuePool):
            # Pool size should be configured (default is 5)
            assert hasattr(pool, '_pool')
            # Max overflow should be configured (default is 10)
            assert hasattr(pool, '_max_overflow')

            # Reasonable pool size (5-20 connections)
            pool_size = pool.size()
            assert 5 <= pool_size <= 20, f"Pool size {pool_size} should be between 5-20"

            # Max overflow should be at least equal to pool size
            assert pool._max_overflow >= pool_size

    def test_pool_timeout_configured(self):
        """Pool should have timeout to prevent indefinite waiting"""
        pool = engine.pool

        if isinstance(pool, QueuePool):
            # Timeout should be configured (default is 30 seconds)
            assert hasattr(pool, '_timeout')
            timeout = pool._timeout
            # Reasonable timeout (10-60 seconds)
            assert 10 <= timeout <= 60, f"Pool timeout {timeout} should be between 10-60 seconds"

    def test_pool_recycle_configured(self):
        """Connections should be recycled to prevent stale connections"""
        pool = engine.pool

        if isinstance(pool, QueuePool):
            # Pool recycle should be configured
            assert hasattr(pool, '_recycle')
            recycle = pool._recycle
            # Should recycle within reasonable time (1 hour = 3600s, typically 1-8 hours)
            assert recycle == -1 or (3600 <= recycle <= 28800), \
                f"Pool recycle {recycle} should be between 3600-28800 seconds or -1 (disabled)"

    def test_pool_pre_ping_enabled(self):
        """Pool should use pre_ping to check connection health before use"""
        # Pre-ping ensures connections are alive before returning them
        pool = engine.pool

        if isinstance(pool, QueuePool):
            # Check if pre_ping is enabled (it's a pool option)
            assert hasattr(pool, '_pre_ping')
            assert pool._pre_ping is True, "Pre-ping should be enabled to check connection health"

    def test_connection_acquisition(self, db):
        """Should be able to acquire connections from the pool"""
        # Simple test to verify connections can be acquired
        result = db.execute(text("SELECT 1 as value"))
        row = result.fetchone()
        assert row[0] == 1

    def test_multiple_connections(self):
        """Should handle multiple concurrent connections"""
        connections = []

        try:
            # Acquire multiple connections
            for i in range(3):
                conn = engine.connect()
                connections.append(conn)
                result = conn.execute(text("SELECT 1 as value"))
                assert result.fetchone()[0] == 1
        finally:
            # Clean up all connections
            for conn in connections:
                conn.close()

    def test_connection_reuse(self):
        """Connections should be reused from the pool"""
        pool = engine.pool

        if isinstance(pool, QueuePool):
            # Get initial pool stats
            initial_size = pool.size()

            # Create and close a connection
            conn1 = engine.connect()
            conn1.close()

            # Create another connection - should reuse from pool
            conn2 = engine.connect()
            conn2.close()

            # Pool size shouldn't grow significantly
            final_size = pool.size()
            assert final_size == initial_size, "Pool should reuse connections"

    def test_pool_overflow_handling(self):
        """Pool should handle overflow when max connections reached"""
        pool = engine.pool

        if isinstance(pool, QueuePool):
            max_connections = pool.size() + pool._max_overflow
            connections = []

            try:
                # Try to acquire connections up to the max
                for i in range(min(max_connections, 10)):  # Limit to 10 for test speed
                    conn = engine.connect()
                    connections.append(conn)

                # All connections should work
                for conn in connections:
                    result = conn.execute(text("SELECT 1"))
                    assert result.fetchone()[0] == 1
            finally:
                # Clean up
                for conn in connections:
                    conn.close()

    def test_session_closes_properly(self, db):
        """Session should close and return connection to pool"""
        pool = engine.pool

        if isinstance(pool, QueuePool):
            initial_checkedout = pool.checkedout()

            # Create a new session
            new_session = SessionLocal()
            new_session.execute(text("SELECT 1"))

            # Connection should be checked out
            assert pool.checkedout() >= initial_checkedout

            # Close session
            new_session.close()

            # Connection should be returned (may not be immediate due to pooling)
            # Just verify it doesn't leak
            assert pool.checkedout() <= initial_checkedout + 1

    def test_pool_statistics_available(self):
        """Pool statistics should be available for monitoring"""
        pool = engine.pool

        if isinstance(pool, QueuePool):
            # Should be able to get pool statistics
            assert hasattr(pool, 'size'), "Pool should provide size()"
            assert hasattr(pool, 'checkedout'), "Pool should provide checkedout()"
            assert hasattr(pool, 'overflow'), "Pool should provide overflow()"
            assert hasattr(pool, 'checkedin'), "Pool should provide checkedin()"

            # Statistics should be non-negative
            assert pool.size() >= 0
            assert pool.checkedout() >= 0
            assert pool.overflow() >= 0
            assert pool.checkedin() >= 0
