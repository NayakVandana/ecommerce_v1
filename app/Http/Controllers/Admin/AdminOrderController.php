<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with('user', 'items.product');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('id', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%');
            });
        }

        // Date range filter
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                \Carbon\Carbon::parse($request->start_date)->startOfDay(),
                \Carbon\Carbon::parse($request->end_date)->endOfDay()
            ]);
        }

        $orders = $query->latest()->paginate(15);

        return $this->sendJsonResponse(true, 'Orders fetched successfully', $orders, 200);
    }

    public function show(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::with('user', 'items.product')->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'status' => 'required|in:pending,processing,shipped,completed,cancelled',
        ]);

        $order = Order::findOrFail($request->id);
        $order->update(['status' => $request->status]);

        return $this->sendJsonResponse(true, 'Order status updated successfully', $order->fresh(), 200);
    }

    public function cancel(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
        ]);

        $order = Order::findOrFail($request->id);

        if ($order->status === 'cancelled') {
            return $this->sendJsonResponse(false, 'Order is already cancelled', [], 400);
        }

        if ($order->status === 'completed') {
            return $this->sendJsonResponse(false, 'Cannot cancel completed order', [], 400);
        }

        $order->update(['status' => 'cancelled']);

        return $this->sendJsonResponse(true, 'Order cancelled successfully', $order->fresh(), 200);
    }
}

