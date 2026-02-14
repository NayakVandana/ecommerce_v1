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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, statsRes] = await Promise.all([
                useDashboardStore.dashboard(),
                useDashboardStore.stats()
            ]);

            if (dashboardRes.data?.status) {
                setRecentOrders(dashboardRes.data.data?.recent_orders || []);
            }

            if (statsRes.data?.status) {
                setStats(statsRes.data.data);
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
                                                            ₹{order.total?.toLocaleString() || '0.00'}
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

