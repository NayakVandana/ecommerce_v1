@props(['url', 'text', 'icon' => null])

@php
    $appUrl = rtrim(config('app.website_url', config('app.url')), '/');
    $url = ltrim($url, '/');
    $fullUrl = str_starts_with($url, 'http') ? $url : $appUrl . '/' . $url;
@endphp

<!-- App Link Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 15px 0;">
    <tr>
        <td align="center" style="padding: 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="background-color: #4F46E5; padding: 12px 24px; border-radius: 6px; text-align: center;">
                        <a href="{{ $fullUrl }}" style="display: inline-block; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; line-height: 1.5;">
                            @if($icon)
                                <span style="margin-right: 8px;">{{ $icon }}</span>
                            @endif
                            {{ $text }}
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

