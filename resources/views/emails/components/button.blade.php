@props(['url', 'text', 'color' => '#4F46E5'])

<!-- Button -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
    <tr>
        <td align="center" style="padding: 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                    <td style="background-color: {{ $color }}; padding: 12px 24px; border-radius: 6px; text-align: center;">
                        <a href="{{ $url }}" style="display: inline-block; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; line-height: 1.5;">
                            {{ $text }}
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

