@php
    $appUrl = rtrim(config('app.website_url', config('app.url')), '/');
    $appName = config('app.name');
    $supportEmail = config('mail.support_email', config('mail.from.address'));
@endphp

<!-- Footer -->
<tr>
    <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
        <!-- Company Info -->
        <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 700; line-height: 1.5;">
            {{ $appName }}
        </p>
        
        @hasSection('footer_content')
            @yield('footer_content')
        @else
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                This is an automated email. Please do not reply to this message.
            </p>
        @endif
        
        <!-- Contact Info -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px;">
            <tr>
                <td align="center" style="padding: 0;">
                    <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                        <a href="mailto:{{ $supportEmail }}" style="color: #667eea; text-decoration: none; font-weight: 600;">{{ $supportEmail }}</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        <a href="{{ $appUrl }}" style="color: #9ca3af; text-decoration: none;">{{ $appUrl }}</a>
                    </p>
                </td>
            </tr>
        </table>
        
        <!-- Copyright -->
        <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
            © {{ date('Y') }} {{ $appName }}. All rights reserved.
        </p>
    </td>
</tr>
