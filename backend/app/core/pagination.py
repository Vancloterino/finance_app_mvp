"""
Pagination utilities with enforced limits.
"""

from typing import Optional
from fastapi import Query


# Global pagination limits
MAX_PAGE_SIZE = 1000
DEFAULT_PAGE_SIZE = 100


def validate_pagination(skip: int = 0, limit: int = DEFAULT_PAGE_SIZE) -> tuple[int, int]:
    """
    Validate and normalize pagination parameters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Tuple of (validated_skip, validated_limit)
    """
    # Ensure skip is non-negative
    validated_skip = max(0, skip)

    # Enforce max limit
    validated_limit = min(max(1, limit), MAX_PAGE_SIZE)

    return validated_skip, validated_limit


class PaginationParams:
    """Dependency for pagination parameters with validation"""

    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description=f"Maximum records to return (max {MAX_PAGE_SIZE})")
    ):
        self.skip = skip
        self.limit = limit


def paginate_query(query, skip: int = 0, limit: int = DEFAULT_PAGE_SIZE):
    """
    Apply pagination to a SQLAlchemy query with validation.

    Args:
        query: SQLAlchemy query object
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Paginated query
    """
    validated_skip, validated_limit = validate_pagination(skip, limit)
    return query.offset(validated_skip).limit(validated_limit)
