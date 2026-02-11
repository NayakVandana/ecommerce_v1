<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice - {{ $order->order_number ?? '#' . $order->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            color: #000000;
            margin: 0;
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #cccccc;
        }
        th {
            background-color: #1e40af;
            color: #ffffff;
            font-weight: bold;
        }
        .header-table {
            border: none;
            margin-bottom: 20px;
        }
        .header-table td {
            border: none;
            padding: 5px 10px;
            vertical-align: top;
        }
        .header-table .company-cell {
            width: 50%;
        }
        .header-table .invoice-cell {
            width: 50%;
            text-align: right;
        }
        h1 {
            font-size: 20px;
            color: #1e40af;
            margin: 0 0 10px 0;
            padding: 0;
        }
        h2 {
            font-size: 18px;
            color: #000000;
            margin: 0 0 10px 0;
            padding: 0;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #1e40af;
            margin: 15px 0 8px 0;
            padding-bottom: 5px;
            border-bottom: 2px solid #1e40af;
        }
        .info-table {
            border: none;
            margin-bottom: 20px;
        }
        .info-table td {
            border: none;
            padding: 3px 10px;
            vertical-align: top;
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
            width: 300px;
            margin-left: auto;
            margin-top: 15px;
            border: 1px solid #cccccc;
        }
        .summary-table td {
            padding: 6px 10px;
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
            font-size: 13px;
            background-color: #f0f0f0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #cccccc;
            text-align: center;
            color: #666666;
            font-size: 9px;
        }
        .status-badge {
            padding: 3px 8px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            display: inline-block;
        }
        .status-pending {
            background-color: #fef3c7;
            color: #92400e;
        }
        .status-processing {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-shipped {
            background-color: #e9d5ff;
            color: #6b21a8;
        }
        .status-completed {
            background-color: #d1fae5;
            color: #065f46;
        }
        .status-cancelled {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .status-delivered {
            background-color: #d1fae5;
            color: #065f46;
        }
        p {
            margin: 3px 0;
            padding: 0;
        }
        strong {
            font-weight: bold;
        }
        small {
            font-size: 9px;
        }
    </style>
</head>
<body>
    <!-- Header Section -->
    <table class="header-table">
        <tr>
            <td class="company-cell">
                <h1>E-Commerce Store</h1>
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Email: info@ecommerce.com</p>
            </td>
            <td class="invoice-cell">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> {{ $order->order_number ?? '#' . $order->id }}</p>
                <p><strong>Date:</strong> {{ \Carbon\Carbon::parse($order->created_at)->format('M d, Y') }}</p>
                <p><strong>Status:</strong> 
                    <span class="status-badge status-{{ $order->status }}">
                        {{ ucfirst(str_replace('_', ' ', $order->status)) }}
                    </span>
                </p>
            </td>
        </tr>
    </table>

    <!-- Bill To and Ship To Section -->
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
                {{ $order->name }}<br>
                @if($order->receiver_name)
                <strong>Receiver:</strong> {{ $order->receiver_name }}<br>
                @endif
                <strong>Receiver Number:</strong> {{ $order->receiver_number ?? $order->phone }}<br>
                @if($order->address_type)
                <strong>Type:</strong> {{ ucfirst($order->address_type) }}<br>
                @endif
                {{ $order->address }}<br>
                @if($order->house_no)
                House No: {{ $order->house_no }}<br>
                @endif
                @if($order->floor_no)
                Floor No: {{ $order->floor_no }}<br>
                @endif
                @if($order->building_name)
                {{ $order->building_name }}<br>
                @endif
                @if($order->landmark)
                Landmark: {{ $order->landmark }}<br>
                @endif
                @if($order->district)
                {{ $order->district }}, 
                @endif
                {{ $order->city }}, {{ $order->postal_code }}<br>
                @if($order->state)
                {{ $order->state }}, 
                @endif
                {{ $order->country }}
                @if($order->delivery_date)
                <br><br>
                <strong>Expected Delivery:</strong> {{ \Carbon\Carbon::parse($order->delivery_date)->format('M d, Y') }}
                @endif
            </td>
        </tr>
    </table>

    <!-- Order Items Section -->
    <div class="section-title">Order Items</div>
    <table>
        <thead>
            <tr>
                <th style="width: 40%;">Item</th>
                <th style="width: 15%;">SKU</th>
                <th style="width: 10%;" class="text-right">Quantity</th>
                <th style="width: 17.5%;" class="text-right">Unit Price</th>
                <th style="width: 17.5%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>
                    <strong>{{ $item->product_name ?? ($item->product->product_name ?? 'N/A') }}</strong>
                    @if($item->size || $item->color)
                        <br><small>
                            @if($item->size) Size: {{ $item->size }} @endif
                            @if($item->color) Color: {{ $item->color }} @endif
                        </small>
                    @endif
                </td>
                <td>{{ $item->product_sku ?? ($item->product->sku ?? 'N/A') }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">${{ number_format($item->price, 2) }}</td>
                <td class="text-right">${{ number_format($item->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Order Summary Section -->
    <table class="summary-table">
        <tr>
            <td class="label-cell">Subtotal:</td>
            <td class="value-cell">${{ number_format($order->subtotal ?? $order->total, 2) }}</td>
        </tr>
        @if($order->discount > 0 && $order->couponCode)
        <tr>
            <td class="label-cell">Discount ({{ $order->couponCode->code }}):</td>
            <td class="value-cell" style="color: #059669;">-${{ number_format($order->discount, 2) }}</td>
        </tr>
        @endif
        @if($order->tax > 0)
        <tr>
            <td class="label-cell">Tax:</td>
            <td class="value-cell">${{ number_format($order->tax, 2) }}</td>
        </tr>
        @endif
        @if($order->shipping > 0)
        <tr>
            <td class="label-cell">Shipping:</td>
            <td class="value-cell">${{ number_format($order->shipping, 2) }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td class="label-cell">Total:</td>
            <td class="value-cell">${{ number_format($order->total, 2) }}</td>
        </tr>
    </table>

    <!-- Delivery Information Section -->
    @if($order->deliveryBoy)
    <div class="section-title">Delivery Information</div>
    <table class="info-table">
        <tr>
            <td>
                <p><strong>Delivery Boy:</strong> {{ $order->deliveryBoy->name }}</p>
                @if($order->deliveryBoy->phone)
                <p><strong>Phone:</strong> {{ $order->deliveryBoy->phone }}</p>
                @endif
                @if($order->otp_code)
                <p><strong>OTP Code:</strong> <strong style="font-size: 13px;">{{ $order->otp_code }}</strong></p>
                @endif
            </td>
        </tr>
    </table>
    @endif

    <!-- Order Notes Section -->
    @if($order->notes)
    <div class="section-title">Order Notes</div>
    <table class="info-table">
        <tr>
            <td>
                <p>{{ $order->notes }}</p>
            </td>
        </tr>
    </table>
    @endif

    <!-- Footer Section -->
    <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>Generated on {{ \Carbon\Carbon::now()->format('M d, Y h:i A') }}</p>
    </div>
</body>
</html>
