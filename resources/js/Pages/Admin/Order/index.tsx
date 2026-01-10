import { useEffect, useState } from 'react';
import { useOrderStore } from './useOrderStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function OrderIndex() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        loadOrders();
    }, [dateRange]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const requestData: any = {};
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useOrderStore.list(requestData);
            if (response.data?.status) {
                setOrders(response.data.data?.data || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const getStatusBadge = (status: string) => {
        const statusColors: any = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
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
        <AdminLayout currentPath="/admin/orders">
            <div className="space-y-6">
                <div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage customer orders</p>
                    </div>
                    
                    {/* Inline Filters */}
                    <div className="bg-white shadow rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex-shrink-0 min-w-[280px]">
                                <FormDatePicker
                                    title="Filter by Date"
                                    isRange={true}
                                    useRange={true}
                                    value={dateRange.startDate && dateRange.endDate ? {
                                        startDate: typeof dateRange.startDate === 'string' 
                                            ? new Date(dateRange.startDate) 
                                            : dateRange.startDate,
                                        endDate: typeof dateRange.endDate === 'string' 
                                            ? new Date(dateRange.endDate) 
                                            : dateRange.endDate
                                    } : null}
                                    handleDateChange={handleDateChange}
                                    noMaxDate={false}
                                    noMinLimit={false}
                                    className="text-sm"
                                    popoverDirection="down"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
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
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.length > 0 ? (
                                    orders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {order.user?.name || 'Guest'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.user?.email || ''}
                                                </div>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="View Details"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No orders found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

