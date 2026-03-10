@props(['type' => 'info', 'title' => null])

@php
    $colors = [
        'info' => ['bg' => '#dbeafe', 'border' => '#3b82f6', 'text' => '#1e40af', 'title' => '#1e3a8a'],
        'warning' => ['bg' => '#fef3c7', 'border' => '#f59e0b', 'text' => '#78350f', 'title' => '#92400e'],
        'error' => ['bg' => '#fee2e2', 'border' => '#ef4444', 'text' => '#991b1b', 'title' => '#991b1b'],
        'success' => ['bg' => '#d1fae5', 'border' => '#10b981', 'text' => '#065f46', 'title' => '#047857'],
    ];
    $color = $colors[$type] ?? $colors['info'];
@endphp

<!-- Alert Box -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
    <tr>
        <td style="background-color: {{ $color['bg'] }}; padding: 20px; border-left: 4px solid {{ $color['border'] }}; border-radius: 4px;">
            @if($title)
                <p style="margin: 0 0 8px 0; color: {{ $color['title'] }}; font-size: 14px; font-weight: bold; line-height: 1.4;">
                    {{ $title }}
                </p>
            @endif
            <p style="margin: 0; color: {{ $color['text'] }}; font-size: 14px; line-height: 1.6;">
                {{ $slot }}
            </p>
        </td>
    </tr>
</table>

