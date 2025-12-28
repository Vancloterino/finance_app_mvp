"""
Contact form endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
from uuid import UUID

from app.schemas.contact import ContactFormSubmission, ContactFormResponse
from app.services.notification import NotificationService
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/submit", response_model=ContactFormResponse)
@limiter.limit("5/hour")  # Rate limit: 5 contact submissions per hour per IP
def submit_contact_form(
    request: Request,
    form_data: ContactFormSubmission
):
    """
    Submit a contact/support form.

    This endpoint allows both authenticated and unauthenticated users to contact support.
    Rate limited to prevent spam.
    """
    try:
        # Generate a simple ticket ID for tracking
        import uuid
        ticket_id = str(uuid.uuid4())[:8].upper()

        # Send email to support
        success = NotificationService.send_support_email(
            name=form_data.name,
            email=form_data.email,
            subject=form_data.subject,
            message=form_data.message,
            phone=form_data.phone,
            company=form_data.company,
            ticket_id=ticket_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to send message. Please try again later or email support@financeapp.com directly."
            )

        return ContactFormResponse(
            message="Your message has been sent successfully. We'll respond within 24 hours.",
            ticket_id=ticket_id
        )

    except Exception as e:
        print(f"Contact form error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )


@router.get("/status/{ticket_id}")
def get_contact_status(ticket_id: str):
    """
    Get status of a contact form submission.

    Future enhancement: Integrate with ticket system.
    """
    return {
        "ticket_id": ticket_id,
        "status": "received",
        "message": "Your message has been received and will be reviewed by our support team."
    }
