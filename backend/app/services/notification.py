from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from jinja2 import Template

from app.core.config import settings
from app.models.user import User
from app.models.space import Space
from app.models.payout import Payout, PayoutStatusEnum
from app.models.pledge import Pledge
from app.schemas.notification import NotificationCreate, NotificationTypeEnum


class NotificationService:
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via SMTP"""
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = settings.EMAIL_FROM
            msg['To'] = to_email
            msg['Subject'] = subject

            # Add text version if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)

            # Add HTML version
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

            # Send email
            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                if settings.EMAIL_USE_TLS:
                    server.starttls()
                if settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD:
                    server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)

                server.send_message(msg)
                return True

        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False

    @staticmethod
    def send_space_invitation(
        invitee_email: str,
        inviter_name: str,
        space_name: str,
        invitation_link: str
    ) -> bool:
        """Send space invitation email"""
        subject = f"You've been invited to join '{space_name}'"

        html_template = Template("""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You're invited to join {{ space_name }}!</h2>

            <p>Hi there!</p>

            <p>{{ inviter_name }} has invited you to join the shared finance space "<strong>{{ space_name }}</strong>".</p>

            <p>This space will help you and your group manage shared expenses, track contributions, and handle payouts transparently.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ invitation_link }}"
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Accept Invitation
                </a>
            </div>

            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ invitation_link }}">{{ invitation_link }}</a></p>

            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                This invitation was sent by {{ inviter_name }}. If you don't know this person or don't want to join this space, you can safely ignore this email.
            </p>
        </body>
        </html>
        """)

        html_content = html_template.render(
            space_name=space_name,
            inviter_name=inviter_name,
            invitation_link=invitation_link
        )

        text_content = f"""
        You're invited to join {space_name}!

        {inviter_name} has invited you to join the shared finance space "{space_name}".

        Click here to accept: {invitation_link}

        This invitation was sent by {inviter_name}.
        """

        return NotificationService.send_email(
            to_email=invitee_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )

    @staticmethod
    def send_payout_consent_request(
        user: User,
        payout: Payout,
        space: Space,
        consent_link: str
    ) -> bool:
        """Send payout consent request email"""
        subject = f"Consent needed for payout in '{space.name}'"

        html_template = Template("""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Consent Required for Payout</h2>

            <p>Hi {{ user_name }}!</p>

            <p>A payout has been proposed in the space "<strong>{{ space_name }}</strong>" that requires your consent.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Payout Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Payee:</strong> {{ payee_name }}</li>
                    <li><strong>Amount:</strong> {{ amount }}</li>
                    <li><strong>Description:</strong> {{ description }}</li>
                    <li><strong>Your share:</strong> {{ user_share }}</li>
                </ul>
            </div>

            <p><strong>Consent deadline:</strong> {{ consent_deadline }}</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ consent_link }}"
                   style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                    Review & Provide Consent
                </a>
            </div>

            <p style="color: #dc3545; font-weight: bold;">
                ⚠️ If you don't respond by the deadline, your consent will be automatically approved.
            </p>

            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                This payout request was created for the space "{{ space_name }}".
            </p>
        </body>
        </html>
        """)

        # Calculate user's share (this is approximate - actual calculation is in PayoutService)
        user_share_amount = int(payout.amount_minor * 0.25)  # Assuming equal split for now

        html_content = html_template.render(
            user_name=user.name,
            space_name=space.name,
            payee_name=payout.payee_name,
            amount=f"{payout.amount_minor / 100:.2f} {payout.currency}",
            description=payout.description,
            user_share=f"{user_share_amount / 100:.2f} {payout.currency}",
            consent_deadline=payout.consent_deadline.strftime("%B %d, %Y at %I:%M %p"),
            consent_link=consent_link
        )

        return NotificationService.send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content
        )

    @staticmethod
    def send_payout_status_update(
        user: User,
        payout: Payout,
        space: Space,
        status_change: str
    ) -> bool:
        """Send payout status update email"""
        status_messages = {
            PayoutStatusEnum.READY: "has been approved and is ready for execution",
            PayoutStatusEnum.EXECUTING: "is now being processed for payment",
            PayoutStatusEnum.SETTLED: "has been completed and payments have been processed",
            PayoutStatusEnum.FAILED: "has failed and will not be processed"
        }

        status_msg = status_messages.get(payout.status, f"status has changed to {payout.status}")
        subject = f"Payout update for '{space.name}'"

        html_template = Template("""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payout Status Update</h2>

            <p>Hi {{ user_name }}!</p>

            <p>The payout to <strong>{{ payee_name }}</strong> in space "<strong>{{ space_name }}</strong>" {{ status_message }}.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Payout Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Amount:</strong> {{ amount }}</li>
                    <li><strong>Description:</strong> {{ description }}</li>
                    <li><strong>Status:</strong> {{ status }}</li>
                </ul>
            </div>

            {% if status == 'SETTLED' %}
            <p style="color: #28a745; font-weight: bold;">
                ✅ Payment has been processed from your default payment method.
            </p>
            {% elif status == 'FAILED' %}
            <p style="color: #dc3545; font-weight: bold;">
                ❌ This payout will not be processed. Please contact the space admin for more information.
            </p>
            {% endif %}
        </body>
        </html>
        """)

        html_content = html_template.render(
            user_name=user.name,
            space_name=space.name,
            payee_name=payout.payee_name,
            amount=f"{payout.amount_minor / 100:.2f} {payout.currency}",
            description=payout.description,
            status_message=status_msg,
            status=payout.status.value
        )

        return NotificationService.send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content
        )

    @staticmethod
    def send_payment_failure_notification(
        user: User,
        payout: Payout,
        space: Space,
        error_message: str
    ) -> bool:
        """Send payment failure notification"""
        subject = f"Payment failed for '{space.name}'"

        html_template = Template("""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Failed</h2>

            <p>Hi {{ user_name }}!</p>

            <p>We were unable to process your payment for the payout to <strong>{{ payee_name }}</strong> in space "<strong>{{ space_name }}</strong>".</p>

            <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3>Error Details:</h3>
                <p>{{ error_message }}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Payout Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Amount:</strong> {{ amount }}</li>
                    <li><strong>Description:</strong> {{ description }}</li>
                </ul>
            </div>

            <h3>What you can do:</h3>
            <ul>
                <li>Check that your payment method is valid and has sufficient funds</li>
                <li>Update your payment method in your account settings</li>
                <li>Contact your bank if the issue persists</li>
            </ul>

            <p>The space admin may retry this payout once you've resolved the payment issue.</p>
        </body>
        </html>
        """)

        html_content = html_template.render(
            user_name=user.name,
            space_name=space.name,
            payee_name=payout.payee_name,
            amount=f"{payout.amount_minor / 100:.2f} {payout.currency}",
            description=payout.description,
            error_message=error_message
        )

        return NotificationService.send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content
        )

    @staticmethod
    def send_pledge_reminder(
        user: User,
        pledge: Pledge,
        space: Space,
        days_until_due: int
    ) -> bool:
        """Send pledge payment reminder"""
        subject = f"Pledge payment reminder for '{space.name}'"

        html_template = Template("""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Pledge Payment Reminder</h2>

            <p>Hi {{ user_name }}!</p>

            <p>This is a friendly reminder about your pledge in space "<strong>{{ space_name }}</strong>".</p>

            <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3>Pledge Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Amount:</strong> {{ amount }}</li>
                    <li><strong>Description:</strong> {{ description }}</li>
                    <li><strong>Due:</strong> {{ due_date }}</li>
                    <li><strong>Days remaining:</strong> {{ days_until_due }}</li>
                </ul>
            </div>

            <p>Please ensure you have sufficient funds available for when this pledge is due.</p>
        </body>
        </html>
        """)

        html_content = html_template.render(
            user_name=user.name,
            space_name=space.name,
            amount=f"{pledge.amount_minor / 100:.2f} {pledge.currency}",
            description=pledge.description,
            due_date=pledge.due_date.strftime("%B %d, %Y") if pledge.due_date else "Not specified",
            days_until_due=days_until_due
        )

        return NotificationService.send_email(
            to_email=user.email,
            subject=subject,
            html_content=html_content
        )