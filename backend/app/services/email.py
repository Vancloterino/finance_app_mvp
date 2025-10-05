"""
Email service for sending transactional emails.
Supports both SMTP and console output for development.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.core.config import settings


class EmailService:
    """Service for sending emails"""

    @staticmethod
    def send_email(
        to: str | List[str],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """
        Send an email.

        Args:
            to: Recipient email address(es)
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (fallback)
            from_email: Sender email (defaults to settings.EMAIL_FROM)
            from_name: Sender name (defaults to settings.EMAIL_FROM_NAME)

        Returns:
            True if email sent successfully, False otherwise
        """
        if not settings.EMAIL_USERNAME or not settings.EMAIL_PASSWORD:
            # Development mode - just log the email
            print(f"\n{'='*60}")
            print(f"[EMAIL] To: {to}")
            print(f"[EMAIL] Subject: {subject}")
            print(f"[EMAIL] Body:\n{text_body or html_body}")
            print(f"{'='*60}\n")
            return True

        # Normalize recipients to list
        recipients = to if isinstance(to, list) else [to]

        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{from_name or settings.EMAIL_FROM_NAME} <{from_email or settings.EMAIL_FROM}>"
            message["To"] = ", ".join(recipients)

            # Add text and HTML parts
            if text_body:
                message.attach(MIMEText(text_body, "plain"))
            message.attach(MIMEText(html_body, "html"))

            # Send email
            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                if settings.EMAIL_USE_TLS:
                    server.starttls()
                server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
                server.sendmail(
                    from_email or settings.EMAIL_FROM,
                    recipients,
                    message.as_string()
                )

            return True

        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

    @staticmethod
    def send_space_invitation(
        to_email: str,
        space_name: str,
        inviter_name: str,
        invitation_link: str
    ) -> bool:
        """Send space invitation email"""
        subject = f"You've been invited to join {space_name}"

        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">Space Invitation</h2>
                <p>Hi there!</p>
                <p><strong>{inviter_name}</strong> has invited you to join the space <strong>{space_name}</strong>.</p>
                <p>Click the link below to accept the invitation:</p>
                <p style="margin: 20px 0;">
                    <a href="{invitation_link}"
                       style="background-color: #4CAF50; color: white; padding: 12px 24px;
                              text-decoration: none; border-radius: 4px; display: inline-block;">
                        Accept Invitation
                    </a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; font-size: 14px;">{invitation_link}</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    This invitation was sent from Finance App. If you didn't expect this email, you can safely ignore it.
                </p>
            </body>
        </html>
        """

        text_body = f"""
        Space Invitation

        Hi there!

        {inviter_name} has invited you to join the space {space_name}.

        Click the link below to accept the invitation:
        {invitation_link}

        ---
        This invitation was sent from Finance App. If you didn't expect this email, you can safely ignore it.
        """

        return EmailService.send_email(to_email, subject, html_body, text_body)

    @staticmethod
    def send_payout_notification(
        to_email: str,
        user_name: str,
        payout_description: str,
        amount: str,
        currency: str,
        space_name: str
    ) -> bool:
        """Send payout notification email"""
        subject = f"New payout proposal in {space_name}"

        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #2196F3;">Payout Proposal</h2>
                <p>Hi {user_name},</p>
                <p>A new payout has been proposed in <strong>{space_name}</strong>:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p><strong>Description:</strong> {payout_description}</p>
                    <p><strong>Amount:</strong> {amount} {currency}</p>
                </div>
                <p>Please review and provide your consent in the app.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    This is an automated notification from Finance App.
                </p>
            </body>
        </html>
        """

        text_body = f"""
        Payout Proposal

        Hi {user_name},

        A new payout has been proposed in {space_name}:

        Description: {payout_description}
        Amount: {amount} {currency}

        Please review and provide your consent in the app.

        ---
        This is an automated notification from Finance App.
        """

        return EmailService.send_email(to_email, subject, html_body, text_body)

    @staticmethod
    def send_payment_failure(
        to_email: str,
        user_name: str,
        error_message: str,
        amount: str,
        currency: str
    ) -> bool:
        """Send payment failure notification"""
        subject = "Payment Failed - Action Required"

        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #f44336;">Payment Failed</h2>
                <p>Hi {user_name},</p>
                <p>We were unable to process your payment:</p>
                <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #f44336;">
                    <p><strong>Amount:</strong> {amount} {currency}</p>
                    <p><strong>Error:</strong> {error_message}</p>
                </div>
                <p>Please update your payment method and try again.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">
                    This is an automated notification from Finance App.
                </p>
            </body>
        </html>
        """

        text_body = f"""
        Payment Failed

        Hi {user_name},

        We were unable to process your payment:

        Amount: {amount} {currency}
        Error: {error_message}

        Please update your payment method and try again.

        ---
        This is an automated notification from Finance App.
        """

        return EmailService.send_email(to_email, subject, html_body, text_body)
