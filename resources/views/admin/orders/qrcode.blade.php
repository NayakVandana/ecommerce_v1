<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment QR Code - Order #{{ $order->order_number ?? $order->id }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 20px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        @media (min-width: 640px) {
            .container {
                padding: 40px;
            }
        }
        .header {
            margin-bottom: 20px;
        }
        @media (min-width: 640px) {
            .header {
                margin-bottom: 30px;
            }
        }
        .header h1 {
            color: #333;
            font-size: 22px;
            margin-bottom: 10px;
        }
        @media (min-width: 640px) {
            .header h1 {
                font-size: 28px;
            }
        }
        .header p {
            color: #666;
            font-size: 14px;
        }
        @media (min-width: 640px) {
            .header p {
                font-size: 16px;
            }
        }
        .order-info {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        @media (min-width: 640px) {
            .order-info {
                padding: 20px;
                margin-bottom: 30px;
            }
        }
        .order-info p {
            margin: 8px 0;
            color: #555;
            font-size: 14px;
        }
        .order-info strong {
            color: #333;
            font-weight: 600;
        }
        .qr-section {
            margin: 30px 0;
        }
        .qr-code-container {
            background: white;
            border: 3px solid #e0e0e0;
            border-radius: 15px;
            padding: 20px;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .qr-code-container img {
            display: block;
            width: 150px;
            height: 150px;
            max-width: 100%;
        }
        @media (min-width: 640px) {
            .qr-code-container img {
                width: 200px;
                height: 200px;
            }
        }
        .payment-info {
            background: #e8f5e9;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .payment-info p {
            margin: 8px 0;
            color: #2e7d32;
            font-size: 14px;
        }
        .payment-info strong {
            color: #1b5e20;
            font-weight: 600;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #1b5e20;
            margin: 10px 0;
        }
        @media (min-width: 640px) {
            .amount {
                font-size: 32px;
            }
        }
        .upi-id {
            font-size: 14px;
            color: #2e7d32;
            margin: 10px 0;
            word-break: break-all;
        }
        @media (min-width: 640px) {
            .upi-id {
                font-size: 18px;
            }
        }
        .instructions {
            margin-top: 30px;
            padding: 20px;
            background: #fff3e0;
            border-radius: 10px;
        }
        .instructions h3 {
            color: #e65100;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .instructions ol {
            text-align: left;
            margin-left: 20px;
            color: #555;
        }
        .instructions li {
            margin: 8px 0;
            font-size: 14px;
        }
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            flex-direction: column;
        }
        @media (min-width: 640px) {
            .actions {
                margin-top: 30px;
                gap: 15px;
                flex-direction: row;
            }
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            width: 100%;
        }
        @media (min-width: 640px) {
            .btn {
                padding: 12px 24px;
                font-size: 16px;
                width: auto;
            }
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }
        .error-message {
            background: #ffebee;
            border: 2px solid #f44336;
            border-radius: 10px;
            padding: 20px;
            color: #c62828;
            margin: 20px 0;
        }
        .error-message strong {
            display: block;
            margin-bottom: 10px;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment QR Code</h1>
            <p>Order #{{ $order->order_number ?? $order->id }}</p>
        </div>

        <div class="order-info">
            <p><strong>Customer:</strong> {{ $order->name }}</p>
            <p><strong>Order Date:</strong> {{ \Carbon\Carbon::parse($order->created_at)->format('M d, Y h:i A') }}</p>
            <p><strong>Order Total:</strong> ₹{{ number_format($order->total, 2) }}</p>
        </div>

        @if(isset($qrCodeUrl) && $qrCodeUrl)
            <div class="qr-section">
                <div class="payment-info">
                    @if(isset($upiId) && $upiId)
                        <p><strong>UPI ID:</strong></p>
                        <p class="upi-id">{{ $upiId }}</p>
                    @endif
                    @if(isset($amount) && $amount > 0)
                        <p><strong>Payment Amount:</strong></p>
                        <p class="amount">₹{{ number_format($amount, 2) }}</p>
                    @endif
                </div>

                <div class="qr-code-container">
                    <img src="{{ $qrCodeUrl }}" alt="Payment QR Code" />
                </div>

                <div class="instructions">
                    <h3>How to Pay:</h3>
                    <ol>
                        <li>Open any UPI app on your phone (Google Pay, PhonePe, Paytm, etc.)</li>
                        <li>Tap on "Scan QR Code"</li>
                        <li>Point your camera at this QR code</li>
                        <li>Verify the amount and UPI ID</li>
                        <li>Complete the payment</li>
                    </ol>
                </div>
            </div>
        @else
            <div class="error-message">
                <strong>QR Code Not Available</strong>
                <p>Unable to generate payment QR code. Please check:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>UPI ID is configured in settings</li>
                    <li>Order has a valid total amount</li>
                </ul>
            </div>
        @endif

        <div class="actions">          
            <button onclick="window.print()" class="btn btn-primary">Print QR Code</button>
        </div>
    </div>
</body>
</html>

