@extends('emails.layouts.base')

@section('title', 'New Contact Form Submission')

@section('header_title', 'New Contact Form')

@section('content')
    <!-- Introduction -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
            <td>
                <p style="margin: 0; color: #1f2937; font-size: 18px; line-height: 1.5; font-weight: 600; margin-bottom: 8px;">
                    New Message Received
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.7;">
                    You have received a new message from the contact form on your website.
                </p>
            </td>
        </tr>
    </table>
    
    <!-- Contact Information Card -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
            <td style="background-color: #f9fafb; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="width: 100px; padding-right: 12px; vertical-align: top;">
                                        <p style="margin: 0; color: #667eea; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Name</p>
                                    </td>
                                    <td style="vertical-align: top;">
                                        <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">{{ $name }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="width: 100px; padding-right: 12px; vertical-align: top;">
                                        <p style="margin: 0; color: #667eea; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                                    </td>
                                    <td style="vertical-align: top;">
                                        <p style="margin: 0; color: #1f2937; font-size: 15px;">
                                            <a href="mailto:{{ $email }}" style="color: #667eea; text-decoration: none; font-weight: 600;">{{ $email }}</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="width: 100px; padding-right: 12px; vertical-align: top;">
                                        <p style="margin: 0; color: #667eea; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Subject</p>
                                    </td>
                                    <td style="vertical-align: top;">
                                        <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">{{ $subject }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    
    <!-- Message Content with Modern Design -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td>
                <p style="margin: 0 0 12px 0; color: #667eea; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Message
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                        <td style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-left: 4px solid #667eea; border-radius: 12px;">
                            <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">{{ $message }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
@endsection

@section('footer_content')
    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
        This email was sent from the contact form on <strong style="color: #1f2937;">{{ config('app.name') }}</strong>
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
        You can reply directly to this email to respond to <strong style="color: #1f2937;">{{ $name }}</strong>
    </p>
@endsection
