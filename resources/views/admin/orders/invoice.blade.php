<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice - {{ $order->order_number ?? '#' . $order->id }}</title>
    <style>
        @page {
            margin: 10mm;
            size: A4;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9px;
            color: #000000;
            margin: 0;
            padding: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        th, td {
            padding: 4px;
            text-align: left;
            border: 1px solid #cccccc;
            font-size: 8px;
        }
        th {
            background-color: #1e40af;
            color: #ffffff;
            font-weight: bold;
            font-size: 9px;
            padding: 5px;
        }
        .header-table {
            border: none;
            margin-bottom: 8px;
        }
        .header-table td {
            border: none;
            padding: 3px 5px;
            vertical-align: top;
        }
        .header-table .company-cell {
            width: 60%;
        }
        .header-table .invoice-cell {
            width: 40%;
            text-align: right;
        }
        h1 {
            font-size: 16px;
            color: #1e40af;
            margin: 0 0 3px 0;
            padding: 0;
        }
        h2 {
            font-size: 14px;
            color: #000000;
            margin: 0 0 3px 0;
            padding: 0;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #1e40af;
            margin: 8px 0 4px 0;
            padding-bottom: 2px;
            border-bottom: 1px solid #1e40af;
        }
        .info-table {
            border: none;
            margin-bottom: 5px;
        }
        .info-table td {
            border: none;
            padding: 2px 5px;
            vertical-align: top;
            font-size: 8px;
        }
        .info-table .left-col {
            width: 50%;
        }
        .info-table .right-col {
            width: 50%;
        }
        .text-right {
            text-align: right;
        }
        .summary-table {
            width: 250px;
            margin-left: auto;
            margin-top: 5px;
            border: 1px solid #cccccc;
            font-size: 8px;
        }
        .summary-table td {
            padding: 3px 6px;
            border: 1px solid #cccccc;
        }
        .summary-table .label-cell {
            text-align: left;
            width: 60%;
        }
        .summary-table .value-cell {
            text-align: right;
            width: 40%;
        }
        .total-row {
            font-weight: bold;
            font-size: 9px;
            background-color: #f0f0f0;
        }
        .footer {
            margin-top: 8px;
            padding-top: 5px;
            border-top: 1px solid #cccccc;
            text-align: center;
            color: #666666;
            font-size: 7px;
        }
        p {
            margin: 1px 0;
            padding: 0;
            line-height: 1.2;
        }
        strong {
            font-weight: bold;
        }
        small {
            font-size: 7px;
        }
        .policy-cell {
            font-size: 7px;
            line-height: 1.2;
            padding: 3px;
        }
        .two-col {
            display: table;
            width: 100%;
            margin-bottom: 5px;
        }
        .two-col > div {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 10px;
        }
        .two-col > div:last-child {
            padding-right: 0;
        }
        .compact-list {
            margin: 2px 0;
            padding-left: 15px;
            font-size: 7px;
            line-height: 1.3;
        }
        .compact-list li {
            margin: 1px 0;
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td class="company-cell">
                <h1>Selorise</h1>
                <p style="margin: 0; font-size: 8px;">123 Business Street, City, State 12345</p>
                <p style="margin: 0; font-size: 8px;">Phone: +1 (555) 123-4567 | Email: info@selorise.com</p>
            </td>
            <td class="invoice-cell">
                <h2>INVOICE</h2>
                <p style="margin: 1px 0; font-size: 8px;"><strong>Invoice #:</strong> {{ $order->order_number ?? '#' . $order->id }}</p>
                <p style="margin: 1px 0; font-size: 8px;"><strong>Date:</strong> {{ \Carbon\Carbon::parse($order->created_at)->format('M d, Y') }}</p>
            </td>
        </tr>
    </table>

    <!-- Customer Information -->
    <div class="section-title">Customer Information</div>
    <table class="info-table">
        <tr>
            <td class="left-col">
                <strong>Bill To:</strong><br>
                {{ $order->name }}<br>
                {{ $order->email }}<br>
                {{ $order->phone }}
            </td>
            <td class="right-col">
                <strong>Ship To:</strong><br>
                {{ $order->name }}
                @if($order->receiver_name)
                    ({{ $order->receiver_name }})
                @endif<br>
                {{ $order->receiver_number ?? $order->phone }}<br>
                {{ $order->address }}
                @if($order->house_no)
                    , H.No: {{ $order->house_no }}
                @endif
                @if($order->floor_no)
                    , Floor: {{ $order->floor_no }}
                @endif<br>
                @if($order->building_name)
                    {{ $order->building_name }}, 
                @endif
                @if($order->landmark)
                    {{ $order->landmark }}, 
                @endif
                @if($order->district)
                    {{ $order->district }}, 
                @endif
                {{ $order->city }}, {{ $order->postal_code }}<br>
                @if($order->state)
                    {{ $order->state }}, 
                @endif
                {{ $order->country }}
            </td>
        </tr>
    </table>

    <!-- Order Items Section -->
    <div class="section-title">Order Items</div>
    <table>
        <thead>
            <tr>
                <th style="width: 25%;">Item</th>
                <th style="width: 10%;">SKU</th>
                <th style="width: 6%;" class="text-right">Qty</th>
                <th style="width: 10%;" class="text-right">Price</th>
                <th style="width: 10%;" class="text-right">Total</th>
                <th style="width: 39%;">Return/Refund/Replace Policy</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td style="font-size: 8px;">
                    <strong>{{ $item->product_name ?? ($item->product->product_name ?? 'N/A') }}</strong>
                    @if($item->size || $item->color)
                        <br><small>
                            @if($item->size)
                                Size: {{ $item->size }}
                            @endif
                            @if($item->size && $item->color)
                                 • 
                            @endif
                            @if($item->color)
                                Color: {{ $item->color }}
                            @endif
                        </small>
                    @endif
                </td>
                <td style="font-size: 8px;">{{ $item->product_sku ?? ($item->product->sku ?? 'N/A') }}</td>
                <td class="text-right" style="font-size: 8px;">{{ $item->quantity }}</td>
                <td class="text-right" style="font-size: 8px;">₹{{ number_format($item->price, 2) }}</td>
                <td class="text-right" style="font-size: 8px;">₹{{ number_format($item->subtotal, 2) }}</td>
                <td class="policy-cell">
                    @if($item->is_returnable ?? ($item->product->is_returnable ?? false))
                        <strong style="color: #059669;">✓ Return/Refund</strong> - 7 days
                        @if($item->product && $item->product->return_policy_note)
                            <br><em style="font-size: 6px;">
                                @if(mb_strlen($item->product->return_policy_note) > 40)
                                    {{ mb_substr($item->product->return_policy_note, 0, 40) }}...
                                @else
                                    {{ $item->product->return_policy_note }}
                                @endif
                            </em>
                        @endif
                    @else
                        <strong style="color: #dc2626;">✗ Not Returnable</strong>
                    @endif
                    <br>
                    @if($item->is_replaceable ?? ($item->product->is_replaceable ?? false))
                        <strong style="color: #2563eb;">✓ Replaceable</strong> - 7 days
                    @else
                        <strong style="color: #dc2626;">✗ Not Replaceable</strong>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Summary and Additional Info in Two Columns -->
    <div class="two-col">
        <div>
            <!-- Order Summary -->
            <table class="summary-table" style="width: 100%;">
                <tr>
                    <td class="label-cell">Subtotal:</td>
                    <td class="value-cell">₹{{ number_format($order->subtotal ?? $order->total, 2) }}</td>
                </tr>
                @if($order->discount > 0 && $order->couponCode)
                <tr>
                    <td class="label-cell">Discount:</td>
                    <td class="value-cell" style="color: #059669;">-₹{{ number_format($order->discount, 2) }}</td>
                </tr>
                @endif
                @if($order->tax > 0)
                <tr>
                    <td class="label-cell">Tax:</td>
                    <td class="value-cell">₹{{ number_format($order->tax, 2) }}</td>
                </tr>
                @endif
                @if($order->shipping > 0)
                <tr>
                    <td class="label-cell">Shipping:</td>
                    <td class="value-cell">₹{{ number_format($order->shipping, 2) }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="label-cell">Total:</td>
                    <td class="value-cell">₹{{ number_format($order->total, 2) }}</td>
                </tr>
            </table>

            {{-- @if($order->deliveryBoy)
            <div style="margin-top: 5px; font-size: 8px;">
                <strong>Delivery:</strong> {{ $order->deliveryBoy->name }}
                @if($order->deliveryBoy->phone)
                    | {{ $order->deliveryBoy->phone }}
                @endif
                @if($order->otp_code)
                    | OTP: <strong>{{ $order->otp_code }}</strong>
                @endif
            </div>
            @endif --}}

            @if($order->notes)
            <div style="margin-top: 3px; font-size: 7px;">
                <strong>Notes:</strong> 
                @if(mb_strlen($order->notes) > 80)
                    {{ mb_substr($order->notes, 0, 80) }}...
                @else
                    {{ $order->notes }}
                @endif
            </div>
            @endif
        </div>
        <div>
            <!-- Terms & Conditions -->
            <div class="section-title" style="margin-top: 0;">Terms & Conditions</div>
            <div style="font-size: 7px; line-height: 1.3;">
                <p style="margin: 2px 0;"><strong>Return/Refund:</strong> Returnable items can be returned within 7 days. Items must be in original condition. Refund processed in 7-14 business days.</p>
                <p style="margin: 2px 0;"><strong>Replacement:</strong> Replaceable items eligible for replacement within 7 days for defective/wrong items. Free shipping for defective items.</p>
                <p style="margin: 2px 0;"><strong>General:</strong> All requests via customer support. Product-specific policies shown above. Terms subject to change.</p>
                <p style="margin: 5px 0 0 0; font-size: 6px;"><strong>Note:</strong> Product-wise eligibility shown in items table above.</p>
            </div>
        </div>
    </div>

    <!-- Footer Section -->
    <div class="footer">
        <p>Thank you for your business! | This is a computer-generated invoice. No signature required.</p>
        <p>Generated on {{ \Carbon\Carbon::now()->format('M d, Y h:i A') }}</p>
    </div>
</body>
</html>
