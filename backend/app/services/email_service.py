from flask_mail import Message
from app.extensions import mail
from flask import current_app
import logging

logger = logging.getLogger(__name__)

def send_email(subject, recipients, body, subtype='html'):
    """Base helper to send email."""
    try:
        msg = Message(
            subject=subject,
            recipients=recipients if isinstance(recipients, list) else [recipients],
            body=body if subtype == 'plain' else None,
            html=body if subtype == 'html' else None,
            sender=(current_app.config.get('MAIL_FROM_NAME', 'GlobalPath'), current_app.config.get('MAIL_DEFAULT_SENDER'))
        )
        mail.send(msg)
        logger.info(f"Email sent to {recipients}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipients}: {str(e)}")
        # Log for dev if sending fails
        print(f"--- EMAIL SENDING FAILED ---")
        print(f"Subject: {subject}")
        print(f"To: {recipients}")
        print(f"Body: {body}")
        print(f"---------------------------")
        return False

def send_password_reset_email(email, reset_token):
    """Send password reset email to user."""
    frontend_url = current_app.config.get('FRONTEND_BASE_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    subject = "Reset Your Password - GlobalPath Logistics"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #009E49; margin: 0;">GlobalPath Logistics</h1>
                <p style="color: #666; margin: 5px 0;">Connecting Ethiopia to the World</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px; border-top: 4px solid #009E49;">
                <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your GlobalPath account. If you made this request, click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background: #009E49; 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              display: inline-block; 
                              font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{reset_link}" style="color: #009E49; word-break: break-all;">{reset_link}</a>
                </p>
                
                <p style="color: #666; font-size: 14px;">
                    <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
                <p>If you didn't request this password reset, please ignore this email.</p>
                <p>This email was sent from GlobalPath P2P Logistics. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(subject, [email], body)

def send_verification_email(email, token):
    """Send email verification link to user."""
    backend_url = current_app.config.get('BACKEND_BASE_URL', 'http://localhost:5000')
    # In a real app, this should probably point to a frontend landing page that calls the backend, 
    # but for now we'll stick to the backend verify-email endpoint or similar.
    verify_link = f"{backend_url}/api/users/verify-email?token={token}"
    
    subject = "Verify Your Email - GlobalPath Logistics"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #009E49; margin: 0;">GlobalPath Logistics</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px; border-top: 4px solid #009E49;">
                <h2 style="color: #333; margin-top: 0;">Welcome to GlobalPath!</h2>
                <p>Hello,</p>
                <p>Thank you for joining our global P2P delivery network. To start sending or delivering items, please verify your email address:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verify_link}" 
                       style="background: #009E49; 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              display: inline-block; 
                              font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(subject, [email], body)

def send_otp_email(email, otp_code):
    """Send OTP verification email to user."""
    subject = "Your Verification Code - GlobalPath"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #009E49; margin: 0;">GlobalPath</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <h2 style="color: #333;">Verification Code</h2>
                <p>Use the code below to verify your action:</p>
                <div style="background: #009E49; color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; display: inline-block; margin: 20px 0;">
                    {otp_code}
                </div>
                <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(subject, [email], body)
