"""Tests for spaces endpoints"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestSpacesEndpoints:
    """Test spaces API endpoints"""

    def test_create_space(self, client: TestClient, auth_headers: dict):
        """Test creating a new space"""
        response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Apartment 2B",
                "description": "Shared expenses for apartment roommates",
                "currency": "USD"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Apartment 2B"
        assert data["currency"] == "USD"
        assert "id" in data

    def test_create_space_short_name(self, client: TestClient, auth_headers: dict):
        """Test creating space with name too short"""
        response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "AB",  # Too short (min 3 chars)
                "description": "Test description",
                "currency": "USD"
            }
        )
        assert response.status_code == 422

    def test_create_space_invalid_currency(self, client: TestClient, auth_headers: dict):
        """Test creating space with invalid currency code"""
        response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Test Space",
                "description": "Test description",
                "currency": "INVALID"  # Not 3-letter code
            }
        )
        assert response.status_code == 422

    def test_create_space_sanitizes_html(self, client: TestClient, auth_headers: dict):
        """Test that HTML is sanitized in space fields"""
        response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "<script>alert('xss')</script>Test Space",
                "description": "<b>Bold text</b> with <script>alert('xss')</script>",
                "currency": "USD"
            }
        )
        assert response.status_code == 201
        data = response.json()
        # HTML should be stripped
        assert "<script>" not in data["name"]
        assert "<b>" not in data["description"]

    def test_get_user_spaces(self, client: TestClient, auth_headers: dict, test_user: dict):
        """Test getting list of user's spaces"""
        # Create a space first
        client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Test Space",
                "description": "Test description",
                "currency": "USD"
            }
        )

        # Get spaces
        response = client.get("/api/v1/spaces/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_space_details(self, client: TestClient, auth_headers: dict):
        """Test getting space details"""
        # Create a space
        create_response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Test Space",
                "description": "Test description",
                "currency": "USD"
            }
        )
        space_id = create_response.json()["id"]

        # Get space details
        response = client.get(f"/api/v1/spaces/{space_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == space_id
        assert data["name"] == "Test Space"
        assert "members" in data

    def test_update_space(self, client: TestClient, auth_headers: dict):
        """Test updating space details"""
        # Create a space
        create_response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Original Name",
                "description": "Original description",
                "currency": "USD"
            }
        )
        space_id = create_response.json()["id"]

        # Update space
        response = client.put(
            f"/api/v1/spaces/{space_id}",
            headers=auth_headers,
            json={
                "name": "Updated Name",
                "description": "Updated description"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated description"

    def test_unauthorized_access(self, client: TestClient):
        """Test accessing spaces without authentication"""
        response = client.get("/api/v1/spaces/")
        assert response.status_code == 401

    def test_access_other_user_space(
        self,
        client: TestClient,
        auth_headers: dict,
        second_test_user: dict
    ):
        """Test that user cannot access another user's private space"""
        # Create space as first user
        create_response = client.post(
            "/api/v1/spaces/",
            headers=auth_headers,
            json={
                "name": "Private Space",
                "description": "Should not be accessible",
                "currency": "USD"
            }
        )
        space_id = create_response.json()["id"]

        # Try to access as second user (not a member)
        from app.core.security import create_access_token
        second_user_token = create_access_token(data={"sub": second_test_user["id"]})
        second_user_headers = {"Authorization": f"Bearer {second_user_token}"}

        response = client.get(f"/api/v1/spaces/{space_id}", headers=second_user_headers)
        # Should return 403 or 404 depending on implementation
        assert response.status_code in [403, 404]
