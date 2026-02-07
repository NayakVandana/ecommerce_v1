<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class DeliveryBoyApiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $query = Order::with(['user', 'items.product'])
            ->where('delivery_boy_id', $user->id);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Orders fetched successfully', $orders, 200);
    }

    public function show(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with(['user', 'items.product', 'couponCode'])
            ->where('delivery_boy_id', $user->id)
            ->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function verifyOTP(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $request->validate([
            'id' => 'required|exists:orders,id',
            'otp' => 'required|string|size:6',
        ]);

        $order = Order::where('delivery_boy_id', $user->id)
            ->findOrFail($request->id);

        if ($order->otp_verified) {
            return $this->sendJsonResponse(false, 'Order already delivered', [], 400);
        }

        if ($order->verifyOTP($request->otp)) {
            return $this->sendJsonResponse(true, 'OTP verified successfully. Order marked as delivered.', $order->fresh(), 200);
        }

        return $this->sendJsonResponse(false, 'Invalid OTP code', [], 400);
    }

    public function getStats(Request $request)
    {
        $user = $request->user();
        
        if (!$user || $user->role !== 'delivery_boy') {
            return $this->sendJsonResponse(false, 'Unauthorized. Delivery boy access required.', [], 403);
        }

        $stats = [
            'total_orders' => Order::where('delivery_boy_id', $user->id)->count(),
            'pending_delivery' => Order::where('delivery_boy_id', $user->id)
                ->where('status', 'out_for_delivery')
                ->where('otp_verified', false)
                ->count(),
            'delivered' => Order::where('delivery_boy_id', $user->id)
                ->where('status', 'delivered')
                ->count(),
            'today_deliveries' => Order::where('delivery_boy_id', $user->id)
                ->where('status', 'delivered')
                ->whereDate('delivered_at', today())
                ->count(),
        ];

        return $this->sendJsonResponse(true, 'Stats fetched successfully', $stats, 200);
    }
}

