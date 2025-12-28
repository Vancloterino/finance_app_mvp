"""Tests for HTTP cache headers on API responses"""
import pytest
from fastapi.testclient import TestClient


class TestCacheHeaders:
    """Test HTTP cache headers are properly set"""

    def test_static_endpoints_have_cache_headers(self, client: TestClient):
        """Static endpoints should have Cache-Control headers"""
        response = client.get("/api/v1/ping")

        assert response.status_code == 200
        # Should have cache headers for static endpoints
        assert "Cache-Control" in response.headers

    def test_public_endpoints_cacheable(self, client: TestClient):
        """Public endpoints should be cacheable with appropriate max-age"""
        response = client.get("/api/v1/ping")

        cache_control = response.headers.get("Cache-Control")
        assert cache_control is not None
        # Should allow caching for public endpoints
        assert "max-age" in cache_control
        assert "public" in cache_control

    def test_authenticated_endpoints_not_cached(self, client: TestClient, auth_headers: dict):
        """Authenticated endpoints should have no-cache headers"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        # Should have Cache-Control header
        assert "Cache-Control" in response.headers
        cache_control = response.headers["Cache-Control"]

        # Should prevent caching for private data
        assert "no-cache" in cache_control or "private" in cache_control

    def test_user_data_endpoints_private(self, client: TestClient, auth_headers: dict):
        """User data endpoints should have private cache directive"""
        response = client.get("/api/v1/spaces/", headers=auth_headers)

        cache_control = response.headers.get("Cache-Control")
        assert cache_control is not None
        # Private data should not be cached by proxies
        assert "private" in cache_control or "no-store" in cache_control

    def test_financial_data_no_store(self, client: TestClient, auth_headers: dict):
        """Financial data endpoints should have no-store to prevent any caching"""
        response = client.get("/api/v1/payments/methods", headers=auth_headers)

        cache_control = response.headers.get("Cache-Control")
        assert cache_control is not None
        # Sensitive financial data should never be cached
        assert "no-store" in cache_control or "no-cache" in cache_control

    def test_post_requests_not_cached(self, client: TestClient, auth_headers: dict):
        """POST requests should have no-cache headers"""
        response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Test Space",
                "description": "Test",
                "currency": "USD"
            }
        )

        cache_control = response.headers.get("Cache-Control")
        assert cache_control is not None
        # Mutations should not be cached
        assert "no-cache" in cache_control or "no-store" in cache_control

    def test_static_config_endpoints_cacheable(self, client: TestClient):
        """Configuration endpoints should be cacheable with reasonable TTL"""
        response = client.get("/api/v1/notifications/config")

        assert response.status_code == 200
        cache_control = response.headers.get("Cache-Control")
        assert cache_control is not None
        # Config can be cached with moderate TTL
        assert "max-age" in cache_control

    def test_etag_header_present(self, client: TestClient, auth_headers: dict):
        """Responses should include ETag for conditional requests"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        # ETag allows browser to validate cache
        assert "ETag" in response.headers or "Last-Modified" in response.headers

    def test_vary_header_for_auth(self, client: TestClient, auth_headers: dict):
        """Authenticated endpoints should have Vary: Authorization header"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        # Vary header indicates response varies by Authorization
        vary = response.headers.get("Vary")
        assert vary is not None
        assert "Authorization" in vary or "Accept" in vary


class TestCacheMiddleware:
    """Test cache middleware functionality"""

    def test_middleware_applies_to_all_routes(self, client: TestClient):
        """Cache middleware should apply to all API routes"""
        endpoints = [
            "/api/v1/ping",
            "/",
        ]

        for endpoint in endpoints:
            response = client.get(endpoint)
            # All responses should have Cache-Control
            assert "Cache-Control" in response.headers, f"Missing Cache-Control on {endpoint}"

    def test_different_cache_for_different_endpoints(self, client: TestClient, auth_headers: dict):
        """Different endpoint types should have different cache policies"""
        public_response = client.get("/api/v1/ping")
        private_response = client.get("/api/v1/users/me", headers=auth_headers)

        public_cache = public_response.headers.get("Cache-Control")
        private_cache = private_response.headers.get("Cache-Control")

        # Public and private endpoints should have different policies
        assert public_cache != private_cache

    def test_no_cache_for_mutations(self, client: TestClient, auth_headers: dict):
        """All mutation operations should have no-cache"""
        # Test POST
        post_response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={"name": "Test", "description": "Test", "currency": "USD"}
        )

        post_cache = post_response.headers.get("Cache-Control")
        assert "no-cache" in post_cache or "no-store" in post_cache
