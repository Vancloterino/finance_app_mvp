"""
Redis caching utilities for the application.
Provides caching for frequently accessed data.
"""

import json
from typing import Optional, Any, Callable
from functools import wraps
import redis
from app.core.config import settings


class CacheService:
    """Redis cache service"""

    _client: Optional[redis.Redis] = None

    @classmethod
    def get_client(cls) -> Optional[redis.Redis]:
        """Get or create Redis client"""
        if cls._client is None:
            try:
                cls._client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                cls._client.ping()
            except Exception as e:
                print(f"Redis connection failed: {e}")
                cls._client = None
        return cls._client

    @classmethod
    def get(cls, key: str) -> Optional[str]:
        """Get value from cache"""
        try:
            client = cls.get_client()
            if client:
                return client.get(key)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None

    @classmethod
    def set(cls, key: str, value: str, ttl: int = 300) -> bool:
        """
        Set value in cache with TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 5 minutes)
        """
        try:
            client = cls.get_client()
            if client:
                client.setex(key, ttl, value)
                return True
        except Exception as e:
            print(f"Cache set error: {e}")
        return False

    @classmethod
    def delete(cls, key: str) -> bool:
        """Delete key from cache"""
        try:
            client = cls.get_client()
            if client:
                client.delete(key)
                return True
        except Exception as e:
            print(f"Cache delete error: {e}")
        return False

    @classmethod
    def invalidate_pattern(cls, pattern: str) -> int:
        """
        Invalidate all keys matching pattern.

        Args:
            pattern: Redis key pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        try:
            client = cls.get_client()
            if client:
                keys = client.keys(pattern)
                if keys:
                    return client.delete(*keys)
        except Exception as e:
            print(f"Cache invalidate error: {e}")
        return 0


def cached(key_prefix: str, ttl: int = 300):
    """
    Decorator to cache function results.

    Usage:
        @cached("user_balance", ttl=600)
        def get_user_balance(user_id: str):
            # expensive operation
            return balance

    Args:
        key_prefix: Prefix for cache key
        ttl: Time to live in seconds
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function args
            # First arg is often 'db' session, skip it
            cache_args = args[1:] if args else []
            key_parts = [str(arg) for arg in cache_args]
            key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = f"{key_prefix}:" + ":".join(key_parts)

            # Try to get from cache
            cached_value = CacheService.get(cache_key)
            if cached_value:
                try:
                    return json.loads(cached_value)
                except json.JSONDecodeError:
                    return cached_value

            # Call function and cache result
            result = func(*args, **kwargs)

            # Cache the result
            try:
                cache_value = json.dumps(result) if not isinstance(result, str) else result
                CacheService.set(cache_key, cache_value, ttl)
            except (TypeError, json.JSONEncodeError):
                # Can't serialize, skip caching
                pass

            return result

        return wrapper
    return decorator


# Cache key patterns for invalidation
class CacheKeys:
    """Common cache key patterns"""

    USER_BALANCE = "balance:user:{user_id}"
    USER_SPACES = "spaces:user:{user_id}"
    SPACE_BALANCE = "balance:space:{space_id}"
    SPACE_MEMBERS = "members:space:{space_id}"
    SPACE_LEDGER = "ledger:space:{space_id}"
    USER_LEDGER = "ledger:user:{user_id}"

    @staticmethod
    def invalidate_user_cache(user_id: str):
        """Invalidate all cache for a user"""
        CacheService.invalidate_pattern(f"*:user:{user_id}*")

    @staticmethod
    def invalidate_space_cache(space_id: str):
        """Invalidate all cache for a space"""
        CacheService.invalidate_pattern(f"*:space:{space_id}*")
