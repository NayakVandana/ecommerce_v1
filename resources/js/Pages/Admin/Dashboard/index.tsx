import { useEffect, useState } from 'react';
import { useDashboardStore } from './useDashboardStore';
import AdminLayout from '../Layout';
import {
    ChartBarIcon,
    ShoppingBagIcon,
    Squares2X2Icon,
    UsersIcon,
    CurrencyDollarIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardIndex() {
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, statsRes, revenueRes] = await Promise.all([
                useDashboardStore.dashboard(),
                useDashboardStore.stats(),
                useDashboardStore.revenue()
            ]);

            if (dashboardRes.data?.status) {
                setRecentOrders(dashboardRes.data.data?.recent_orders || []);
            }

            if (statsRes.data?.status) {
                setStats(statsRes.data.data);
            }

            if (revenueRes.data?.status) {
                setRevenueData(revenueRes.data.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            name: 'Total Orders',
            value: stats?.total_orders || 0,
            icon: ShoppingBagIcon,
            color: 'bg-blue-500',
        },
        {
            name: 'Pending Orders',
            value: stats?.pending_orders || 0,
            icon: ClockIcon,
            color: 'bg-yellow-500',
        },
        {
            name: 'Total Products',
            value: stats?.total_products || 0,
            icon: Squares2X2Icon,
            color: 'bg-green-500',
        },
        {
            name: 'Total Users',
            value: stats?.total_users || 0,
            icon: UsersIcon,
            color: 'bg-purple-500',
        },
        {
            name: 'Total Revenue',
            value: `$${stats?.total_revenue?.toLocaleString() || '0'}`,
            icon: CurrencyDollarIcon,
            color: 'bg-indigo-500',
        },
        {
            name: 'Active Products',
            value: stats?.active_products || 0,
            icon: CheckCircleIcon,
            color: 'bg-emerald-500',
        },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors: any = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            processing: 'bg-blue-100 text-blue-800',
        };

        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                statusColors[status] || 'bg-gray-100 text-gray-800'
            }`}>
                {status}
            </span>
        );
    };

    return (
        <AdminLayout currentPath="/admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">Overview of your ecommerce platform</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {statCards.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.name}
                                        className="bg-white overflow-hidden shadow rounded-lg"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                                                    <Icon className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            {stat.name}
                                                        </dt>
                                                        <dd className="text-2xl font-semibold text-gray-900">
                                                            {stat.value}
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Revenue Section */}
                        {revenueData && (
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-medium text-gray-900">Revenue Analytics</h3>
                                        <ChartBarIcon className="h-6 w-6 text-indigo-600" />
                                    </div>

                                    {/* Revenue Overview Cards */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                                            <p className="text-sm font-medium opacity-90">Today</p>
                                            <p className="text-2xl font-bold mt-1">
                                                ${(revenueData.today_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">{revenueData.today_orders || 0} orders</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                                            <p className="text-sm font-medium opacity-90">This Week</p>
                                            <p className="text-2xl font-bold mt-1">
                                                ${(revenueData.week_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">{revenueData.week_orders || 0} orders</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                                            <p className="text-sm font-medium opacity-90">This Month</p>
                                            <p className="text-2xl font-bold mt-1">
                                                ${(revenueData.month_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">{revenueData.month_orders || 0} orders</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                            <p className="text-sm font-medium opacity-90">This Year</p>
                                            <p className="text-2xl font-bold mt-1">
                                                ${(revenueData.year_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">{revenueData.year_orders || 0} orders</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg p-4 text-white">
                                            <p className="text-sm font-medium opacity-90">All Time</p>
                                            <p className="text-2xl font-bold mt-1">
                                                ${(revenueData.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">{revenueData.total_orders || 0} orders</p>
                                        </div>
                                    </div>

                                    {/* Monthly Revenue Chart */}
                                    <div className="mb-6">
                                        <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue by Month (Last 12 Months)</h4>
                                        <div className="space-y-2">
                                            {revenueData.monthly_revenue && revenueData.monthly_revenue.length > 0 ? (
                                                revenueData.monthly_revenue.map((item: any, index: number) => {
                                                    const maxRevenue = Math.max(...revenueData.monthly_revenue.map((m: any) => m.revenue || 0));
                                                    const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                                                    
                                                    return (
                                                        <div key={index} className="flex items-center space-x-4">
                                                            <div className="w-20 text-sm text-gray-600 font-medium">
                                                                {item.month}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                                                                    <div
                                                                        className="bg-indigo-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                                                        style={{ width: `${percentage}%` }}
                                                                    >
                                                                        {percentage > 10 && (
                                                                            <span className="text-xs text-white font-medium">
                                                                                ${(item.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="w-24 text-right text-sm font-semibold text-gray-900">
                                                                ${(item.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-sm text-gray-500">No revenue data available</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Daily Revenue Chart */}
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-900 mb-4">Revenue by Day (Last 30 Days)</h4>
                                        <div className="overflow-x-auto">
                                            <div className="flex space-x-1 min-w-max pb-4">
                                                {revenueData.daily_revenue && revenueData.daily_revenue.length > 0 ? (
                                                    revenueData.daily_revenue.map((item: any, index: number) => {
                                                        const maxRevenue = Math.max(...revenueData.daily_revenue.map((d: any) => d.revenue || 0));
                                                        const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                                                        
                                                        return (
                                                            <div key={index} className="flex flex-col items-center min-w-[30px] group relative">
                                                                <div className="w-full bg-gray-200 rounded-t" style={{ height: '120px', position: 'relative' }}>
                                                                    <div
                                                                        className="w-full bg-indigo-600 rounded-t absolute bottom-0 transition-all duration-300 hover:bg-indigo-700 cursor-pointer"
                                                                        style={{ height: `${height}%` }}
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1 text-center">
                                                                    {item.day.split(' ')[1]}
                                                                </div>
                                                                {/* Tooltip on hover */}
                                                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                                                                    <div className="font-semibold">{item.day}</div>
                                                                    <div>${(item.revenue || 0).toFixed(2)}</div>
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-sm text-gray-500">No daily revenue data available</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Orders */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Order ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentOrders.length > 0 ? (
                                                recentOrders.map((order: any) => (
                                                    <tr key={order.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            #{order.id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {order.user?.name || 'Guest'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            ${order.total?.toLocaleString() || '0.00'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(order.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        No recent orders
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}

