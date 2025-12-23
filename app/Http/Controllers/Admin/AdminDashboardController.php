<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'total_products' => Product::count(),
            'active_products' => Product::where('is_approve', 1)->count(),
            'total_users' => User::count(),
            'total_revenue' => Order::where('status', 'completed')->sum('total'),
        ];

        $recentOrders = Order::with('user')
            ->latest()
            ->take(10)
            ->get();

        return $this->sendJsonResponse(true, 'Dashboard data fetched successfully', [
            'stats' => $stats,
            'recent_orders' => $recentOrders,
        ], 200);
    }

    public function stats()
    {
        $stats = [
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'completed_orders' => Order::where('status', 'completed')->count(),
            'cancelled_orders' => Order::where('status', 'cancelled')->count(),
            'total_products' => Product::count(),
            'active_products' => Product::where('is_approve', 1)->count(),
            'inactive_products' => Product::where('is_approve', 0)->count(),
            'total_users' => User::count(),
            'admin_users' => User::where('role', 'admin')->count(),
            'total_revenue' => Order::where('status', 'completed')->sum('total'),
        ];

        return $this->sendJsonResponse(true, 'Statistics fetched successfully', $stats, 200);
    }
}

