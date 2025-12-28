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
    @staticmethod
    def send_support_email(
        name: str,
        email: str,
        subject: str,
        message: str,
        phone: str = None,
        company: str = None,
        ticket_id: str = None
    ) -> bool:
        """
        Send a support/contact form submission email to the support team.
        """
        from app.services.email import EmailService
        
        email_subject = f"[Support #{ticket_id}] {subject}"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #0070BA; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">New Support Request</h2>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket #{ticket_id}</p>
                </div>

                <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
                    <h3 style="color: #0070BA;">Contact Information</h3>
                    <p><strong>Name:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    {f'<p><strong>Phone:</strong> {phone}</p>' if phone else ''}
                    {f'<p><strong>Company:</strong> {company}</p>' if company else ''}

                    <h3 style="color: #0070BA;">Subject</h3>
                    <p>{subject}</p>

                    <h3 style="color: #0070BA;">Message</h3>
                    <div style="background-color: white; padding: 15px; border-radius: 4px;">
                        {message}
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            return EmailService.send_email(
                to="support@financeapp.com",
                subject=email_subject,
                html_body=html_body
            )
        except Exception as e:
            print(f"Failed to send support email: {str(e)}")
            return False


    @staticmethod
    def send_password_reset_email(
        email: str,
        name: str,
        reset_token: str
    ) -> bool:
        """
        Send password reset email with reset link.
        """
        from app.services.email import EmailService
        from app.core.config import settings
        
        # Construct reset URL (frontend will handle the token)
        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        email_subject = "Reset Your Password - FinanceApp"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #0070BA; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">Password Reset Request</h2>
                </div>

                <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
                    <p>Hi {name},</p>
                    
                    <p>We received a request to reset your password for your FinanceApp account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #0070BA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #e9e9e9; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                        {reset_url}
                    </p>
                    
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    
                    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #666;">
                        For security, this request was received from your account. If you did not make this request, 
                        please contact us immediately at support@financeapp.com.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>FinanceApp - Simplifying shared financial responsibilities</p>
                    <p>© 2025 FinanceApp Inc. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            return EmailService.send_email(
                to=email,
                subject=email_subject,
                html_body=html_body
            )
        except Exception as e:
            print(f"Failed to send password reset email: {str(e)}")
            return False



    @staticmethod
    def send_verification_email(
        email: str,
        name: str,
        verification_token: str
    ) -> bool:
        """
        Send email verification email with verification link.
        """
        from app.services.email import EmailService
        from app.core.config import settings
        
        # Construct verification URL (frontend will handle the token)
        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:3000"
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"

        email_subject = "Verify Your Email - FinanceApp"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #0070BA; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">Welcome to FinanceApp!</h2>
                </div>

                <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd;">
                    <p>Hi {name},</p>
                    
                    <p>Thanks for signing up for FinanceApp! We're excited to have you on board.</p>
                    
                    <p>To get started, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_url}" 
                           style="background-color: #0070BA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #e9e9e9; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                        {verification_url}
                    </p>
                    
                    <p><strong>This link will expire in 24 hours.</strong></p>
                    
                    <p>If you didn't create an account with FinanceApp, please ignore this email.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #666;">
                        Once verified, you'll be able to create spaces, manage shared expenses, and collaborate with your group.
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>FinanceApp - Simplifying shared financial responsibilities</p>
                    <p>© 2025 FinanceApp Inc. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            return EmailService.send_email(
                to=email,
                subject=email_subject,
                html_body=html_body
            )
        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            return False

