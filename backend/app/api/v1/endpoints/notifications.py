from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.notification import NotificationService
from app.schemas.notification import EmailTestRequest

router = APIRouter()


@router.post("/test-email")
def test_email(
    email_request: EmailTestRequest,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Test email functionality (development/admin only)"""
    # TODO: Add admin role check - currently any authenticated user can access

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>{email_request.message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
            This is a test email from the Finance App notification system.
        </p>
    </body>
    </html>
    """

    success = NotificationService.send_email(
        to_email=email_request.to_email,
        subject=email_request.subject,
        html_content=html_content,
        text_content=email_request.message
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send test email"
        )

    return {
        "message": "Test email sent successfully",
        "recipient": email_request.to_email
    }


@router.get("/config")
def get_notification_config():
    """Get notification configuration (for debugging)"""
    from app.core.config import settings

    return {
        "email_configured": bool(settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD),
        "email_host": settings.EMAIL_HOST,
        "email_port": settings.EMAIL_PORT,
        "email_from": settings.EMAIL_FROM,
        "email_use_tls": settings.EMAIL_USE_TLS
    }