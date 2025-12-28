"""
Tests for re-authentication on sensitive operations.
"""
import pytest
from fastapi.testclient import TestClient

class TestReauthentication:
    """Test cases for password re-authentication"""

    def test_payment_deletion_requires_password(self, client: TestClient, test_user_token: str):
        """Test that payment method deletion requires password"""
        # Try to delete without password
        response = client.delete(
            "/api/v1/payments/payment-methods/pm_test123",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        # Should fail with 422 (missing required field)
        assert response.status_code == 422

    def test_payment_deletion_wrong_password(self, client: TestClient, test_user: dict, test_user_token: str):
        """Test payment deletion with wrong password"""
        response = client.delete(
            "/api/v1/payments/payment-methods/pm_test123",
            params={"password": "wrong_password"},
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 401
        assert "password verification failed" in response.json()["detail"].lower()

    def test_payment_deletion_correct_password(self, client: TestClient, test_user: dict, test_user_token: str):
        """Test payment deletion with correct password"""
        # This will fail because payment method doesn't exist, but password verification should pass
        response = client.delete(
            "/api/v1/payments/payment-methods/pm_test123",
            params={"password": test_user["password"]},  # Use the actual password
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        # Should get past password check (either 404 for missing payment method or 400 for Stripe error)
        assert response.status_code in [400, 404]
        # Should NOT be 401 (unauthorized)
        assert response.status_code != 401 or "password" not in response.json()["detail"].lower()

    def test_payout_execution_requires_password(self, client: TestClient, test_user_token: str):
        """Test that payout execution requires password"""
        from uuid import uuid4
        payout_id = uuid4()

        # Try to execute without password
        response = client.post(
            f"/api/v1/payouts/{payout_id}/execute",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        # Should fail with 422 (missing required field)
        assert response.status_code == 422

    def test_payout_execution_wrong_password(self, client: TestClient, test_user: dict, test_user_token: str):
        """Test payout execution with wrong password"""
        from uuid import uuid4
        payout_id = uuid4()

        response = client.post(
            f"/api/v1/payouts/{payout_id}/execute",
            params={"password": "wrong_password"},
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 401
        assert "password verification failed" in response.json()["detail"].lower()
