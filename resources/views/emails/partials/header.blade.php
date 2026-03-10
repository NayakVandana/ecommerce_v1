@php
    $appUrl = rtrim(config('app.website_url', config('app.url')), '/');
    $logoPath = config('app.logo_url', '/images/logo/light-mode-logo.png');
    $appName = config('app.name');
    
    // Make logo URL absolute for email clients
    if (str_starts_with($logoPath, 'http')) {
        $logoUrl = $logoPath;
    } else {
        $logoPath = ltrim($logoPath, '/');
        $logoUrl = $appUrl . '/' . $logoPath;
    }
@endphp

<!-- Header -->
<tr>
    <td style="background-color: #ffffff; padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
        <!-- Logo -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding-bottom: 20px;">
                    <a href="{{ $appUrl }}" style="text-decoration: none; display: inline-block;">
                        <!--[if mso]>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                                <td style="background-color: #667eea; padding: 12px 24px; border-radius: 8px;">
                                    <span style="color: #ffffff; font-size: 20px; font-weight: bold;">{{ $appName }}</span>
                                </td>
                            </tr>
                        </table>
                        <![endif]-->
                        <!--[if !mso]><!-->
                        <img src="{{ $logoUrl }}" alt="{{ $appName }}" width="200" height="auto" style="max-width: 200px; width: 200px; height: auto; display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;" />
                        <!--<![endif]-->
                    </a>
                </td>
            </tr>
        </table>
        
        <!-- Title -->
        @hasSection('header_title')
            <h1 style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700; line-height: 1.2;">
                @yield('header_title')
            </h1>
        @endif
    </td>
</tr>
