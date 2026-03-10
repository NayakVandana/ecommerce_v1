@props(['label', 'value', 'type' => 'text', 'url' => null])

<!-- Field -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
    <tr>
        <td style="padding-bottom: 8px;">
            <span style="color: #4F46E5; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">{{ $label }}</span>
        </td>
    </tr>
    <tr>
        <td style="background-color: #f9fafb; padding: 12px 15px; border: 1px solid #e5e7eb; border-radius: 4px;">
            @if($type === 'link' && $url)
                <a href="{{ $url }}" style="color: #4F46E5; font-size: 16px; text-decoration: none; line-height: 1.5;">{{ $value }}</a>
            @elseif($type === 'email')
                <a href="mailto:{{ $value }}" style="color: #4F46E5; font-size: 16px; text-decoration: none; line-height: 1.5;">{{ $value }}</a>
            @else
                <span style="color: #111827; font-size: 16px; line-height: 1.5;">{{ $value }}</span>
            @endif
        </td>
    </tr>
</table>

