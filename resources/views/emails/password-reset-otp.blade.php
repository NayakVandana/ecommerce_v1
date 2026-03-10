@extends('emails.layouts.base')

@section('title', 'Password Reset - ' . $appName)

@section('header_title', 'Reset Your Password')

@section('content')
    <!-- Greeting -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
            <td>
                <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; line-height: 1.5; font-weight: 600;">
                    Hello {{ $userName }},
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.7;">
                    We received a request to reset your password. Use the verification code below to complete the process.
                </p>
            </td>
        </tr>
    </table>
    
    <!-- OTP Display with Modern Design -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
            <td align="center" style="padding: 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; border-radius: 12px; padding: 32px 24px; border: 1px solid #e5e7eb;">
                    <tr>
                        <td align="center" style="padding: 0;">
                            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                                Verification Code
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 10px; padding: 20px 30px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <p style="margin: 0; color: #667eea; font-size: 42px; font-weight: 700; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; line-height: 1.2;">
                                            {{ $otp }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                                This code expires in 24 hours
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Instructions with Icons -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-radius: 12px; border-left: 4px solid #667eea; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 700; line-height: 1.4;">
                    Steps to reset your password:
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="padding: 8px 0;">
                            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7;">
                                <span style="display: inline-block; width: 28px; height: 28px; background-color: #667eea; color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px; margin-right: 12px; vertical-align: middle;">1</span>
                                Enter the code above in the password reset form
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">
                            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7;">
                                <span style="display: inline-block; width: 28px; height: 28px; background-color: #667eea; color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px; margin-right: 12px; vertical-align: middle;">2</span>
                                Create your new secure password
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">
                            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7;">
                                <span style="display: inline-block; width: 28px; height: 28px; background-color: #667eea; color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 14px; margin-right: 12px; vertical-align: middle;">3</span>
                                Sign in with your new password
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Security Note with Modern Design -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 16px; background-color: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6; font-weight: 500;">
                    <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.
                </p>
            </td>
        </tr>
    </table>
@endsection

@section('footer_content')
    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
        This is an automated email. Please do not reply to this message.
    </p>
    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
        For security reasons, this verification code will expire in 24 hours.
    </p>
@endsection
