@props(['label', 'content'])

<!-- Message Box -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
        <td style="padding-bottom: 8px;">
            <span style="color: #4F46E5; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">{{ $label }}</span>
        </td>
    </tr>
    <tr>
        <td style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #4F46E5; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 4px;">
            <p style="margin: 0; color: #111827; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">{{ $content }}</p>
        </td>
    </tr>
</table>

