"""HTTP Cache Headers Middleware"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from typing import Callable
import hashlib
import json
from io import BytesIO


class CacheHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add appropriate cache headers to API responses"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)

        # Determine cache policy based on endpoint and method
        path = request.url.path
        method = request.method
        has_auth = "authorization" in request.headers

        # Default: no caching
        cache_control = "no-cache, no-store, must-revalidate"
        vary_header = "Accept"

        # Public static endpoints (safe to cache)
        if path in ["/api/v1/ping", "/", "/health"] and method == "GET":
            cache_control = "public, max-age=300"  # 5 minutes

        # Configuration endpoints (moderate caching)
        elif "/config" in path and method == "GET":
            cache_control = "public, max-age=600"  # 10 minutes

        # Authenticated GET requests (private, short cache)
        elif has_auth and method == "GET":
            # User-specific data should be private
            if any(keyword in path for keyword in ["/users/me", "/spaces", "/payments", "/pledges", "/payouts"]):
                # Sensitive financial data - no caching
                if any(keyword in path for keyword in ["/payments", "/payouts"]):
                    cache_control = "no-store, no-cache, must-revalidate, private"
                else:
                    # Other private data - private cache only
                    cache_control = "private, no-cache, must-revalidate"

            vary_header = "Accept, Authorization"

        # All mutations (POST, PUT, DELETE, PATCH) - never cache
        elif method in ["POST", "PUT", "DELETE", "PATCH"]:
            cache_control = "no-cache, no-store, must-revalidate"

        # Set Cache-Control header
        response.headers["Cache-Control"] = cache_control

        # Set Vary header for content negotiation
        response.headers["Vary"] = vary_header

        # Add ETag for GET requests with successful responses
        if method == "GET" and response.status_code == 200:
            # Generate ETag from response body
            try:
                # Check if response has a body attribute (e.g., Response object)
                if hasattr(response, "body") and response.body:
                    body_hash = hashlib.md5(response.body).hexdigest()
                    response.headers["ETag"] = f'"{body_hash}"'
                # For StreamingResponse, we need to consume and rebuild
                elif isinstance(response, StreamingResponse):
                    # Collect body chunks
                    body_parts = []
                    async for chunk in response.body_iterator:
                        body_parts.append(chunk)

                    body_content = b"".join(body_parts)
                    body_hash = hashlib.md5(body_content).hexdigest()

                    # Rebuild response with body and ETag
                    response = Response(
                        content=body_content,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type=response.media_type
                    )
                    response.headers["ETag"] = f'"{body_hash}"'
            except Exception:
                # If we can't generate ETag, just skip it
                pass

        return response
