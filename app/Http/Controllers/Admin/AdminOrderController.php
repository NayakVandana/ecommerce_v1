<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['user', 'items.product', 'couponCode']);

        // Handle section-based filtering
        if ($request->has('section')) {
            $section = $request->section;
            switch ($section) {
                case 'pending':
                    $query->where('status', 'pending');
                    break;
                case 'ready-for-shipping':
                    // Orders that are processing (ready to be shipped)
                    $query->where('status', 'processing');
                    break;
                case 'shipped':
                    $query->where('status', 'shipped');
                    break;
                case 'out-for-delivery':
                    // Map to shipped status for now, or create a new status
                    $query->where('status', 'shipped');
                    break;
                case 'delivered':
                    $query->where('status', 'completed');
                    break;
                case 'failed-delivery':
                    $query->where('status', 'cancelled');
                    break;
                case 'picked-up':
                    // Map to completed for now
                    $query->where('status', 'completed');
                    break;
                case 'completed':
                    $query->where('status', 'completed');
                    break;
                case 'cancelled':
                    $query->where('status', 'cancelled');
                    break;
                case 'return-refund':
                    // Map to cancelled for now, or create a new status
                    $query->where('status', 'cancelled');
                    break;
                case 'processed':
                    // Orders that are shipped or completed
                    $query->whereIn('status', ['shipped', 'completed']);
                    break;
                case 'all':
                    // No status filter - show all orders
                    break;
                default:
                    // If no section or invalid section, show all
                    break;
            }
        } elseif ($request->has('status')) {
            // Legacy support for direct status filtering
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('id', 'like', '%' . $request->search . '%')
                  ->orWhere('order_number', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('name', 'like', '%' . $request->search . '%')
                  ->orWhereHas('user', function($userQuery) use ($request) {
                      $userQuery->where('name', 'like', '%' . $request->search . '%')
                                ->orWhere('email', 'like', '%' . $request->search . '%');
                  });
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

        $order = Order::with(['user', 'items.product', 'couponCode'])->findOrFail($request->id);

        return $this->sendJsonResponse(true, 'Order fetched successfully', $order, 200);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:orders,id',
            'status' => 'required|in:pending,processing,shipped,completed,cancelled,ready_for_shipping,out_for_delivery,delivered,failed_delivery,picked_up,return_refund',
        ]);

        $order = Order::findOrFail($request->id);
        
        // Map UI statuses to database statuses
        $statusMapping = [
            'ready_for_shipping' => 'processing',
            'out_for_delivery' => 'shipped',
            'delivered' => 'completed',
            'failed_delivery' => 'cancelled',
            'picked_up' => 'completed',
            'return_refund' => 'cancelled',
        ];
        
        $status = $statusMapping[$request->status] ?? $request->status;
        $order->update(['status' => $status]);

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

    public function getCounts(Request $request)
    {
        $counts = [
            'all' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'ready-for-shipping' => Order::where('status', 'processing')->count(),
            'shipped' => Order::where('status', 'shipped')->count(),
            'out-for-delivery' => Order::where('status', 'shipped')->count(),
            'delivered' => Order::where('status', 'completed')->count(),
            'failed-delivery' => Order::where('status', 'cancelled')->count(),
            'picked-up' => Order::where('status', 'completed')->count(),
            'completed' => Order::where('status', 'completed')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
            'return-refund' => Order::where('status', 'cancelled')->count(),
            'processed' => Order::whereIn('status', ['shipped', 'completed'])->count(),
        ];

        return $this->sendJsonResponse(true, 'Order counts fetched successfully', $counts, 200);
    }
}

