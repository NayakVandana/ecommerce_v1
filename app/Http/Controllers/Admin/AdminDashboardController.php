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

    public function revenue(Request $request)
    {
        $period = $request->input('period', 'all'); // all, today, week, month, year, custom
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        $baseQuery = Order::where('status', 'completed');
        
        // Apply date range filter if custom dates are provided
        if ($startDate && $endDate) {
            $baseQuery->whereBetween('created_at', [
                \Carbon\Carbon::parse($startDate)->startOfDay(),
                \Carbon\Carbon::parse($endDate)->endOfDay()
            ]);
        }
        
        $revenueData = [
            'total_revenue' => Order::where('status', 'completed')->sum('total'),
            'today_revenue' => (clone $baseQuery)->whereDate('created_at', today())->sum('total'),
            'week_revenue' => (clone $baseQuery)->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->sum('total'),
            'month_revenue' => (clone $baseQuery)->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->sum('total'),
            'year_revenue' => (clone $baseQuery)->whereYear('created_at', now()->year)->sum('total'),
            'total_orders' => Order::where('status', 'completed')->count(),
            'today_orders' => (clone $baseQuery)->whereDate('created_at', today())->count(),
            'week_orders' => (clone $baseQuery)->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
            'month_orders' => (clone $baseQuery)->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)->count(),
            'year_orders' => (clone $baseQuery)->whereYear('created_at', now()->year)->count(),
        ];

        // Calculate filtered revenue if date range is provided
        if ($startDate && $endDate) {
            $filteredQuery = Order::where('status', 'completed')
                ->whereBetween('created_at', [
                    \Carbon\Carbon::parse($startDate)->startOfDay(),
                    \Carbon\Carbon::parse($endDate)->endOfDay()
                ]);
            
            $revenueData['filtered_revenue'] = $filteredQuery->sum('total');
            $revenueData['filtered_orders'] = $filteredQuery->count();
        }

        // Get revenue by month for the last 12 months or within date range
        $monthlyRevenue = [];
        $startMonth = $startDate ? \Carbon\Carbon::parse($startDate) : now()->subMonths(11);
        $endMonth = $endDate ? \Carbon\Carbon::parse($endDate) : now();
        
        $currentMonth = $startMonth->copy()->startOfMonth();
        while ($currentMonth <= $endMonth) {
            $monthName = $currentMonth->format('M Y');
            $monthQuery = (clone $baseQuery)
                ->whereMonth('created_at', $currentMonth->month)
                ->whereYear('created_at', $currentMonth->year);
            
            // Apply date range filter if provided
            if ($startDate && $endDate) {
                $monthQuery->whereBetween('created_at', [
                    \Carbon\Carbon::parse($startDate)->startOfDay(),
                    \Carbon\Carbon::parse($endDate)->endOfDay()
                ]);
            }
            
            $revenue = $monthQuery->sum('total');
            
            $monthlyRevenue[] = [
                'month' => $monthName,
                'revenue' => $revenue,
            ];
            
            $currentMonth->addMonth();
        }

        // Get revenue by day for the last 30 days or within date range
        $dailyRevenue = [];
        $startDay = $startDate ? \Carbon\Carbon::parse($startDate) : now()->subDays(29);
        $endDay = $endDate ? \Carbon\Carbon::parse($endDate) : now();
        
        $currentDay = $startDay->copy();
        while ($currentDay <= $endDay) {
            $dayName = $currentDay->format('M d');
            $dayQuery = (clone $baseQuery)
                ->whereDate('created_at', $currentDay->toDateString());
            
            // Apply date range filter if provided
            if ($startDate && $endDate) {
                $dayQuery->whereBetween('created_at', [
                    \Carbon\Carbon::parse($startDate)->startOfDay(),
                    \Carbon\Carbon::parse($endDate)->endOfDay()
                ]);
            }
            
            $revenue = $dayQuery->sum('total');
            
            $dailyRevenue[] = [
                'day' => $dayName,
                'revenue' => $revenue,
            ];
            
            $currentDay->addDay();
        }

        $revenueData['monthly_revenue'] = $monthlyRevenue;
        $revenueData['daily_revenue'] = $dailyRevenue;

        return $this->sendJsonResponse(true, 'Revenue data fetched successfully', $revenueData, 200);
    }
}

