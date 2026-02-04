import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useCouponStore } from './useCouponStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import {
    TicketIcon,
    ShoppingBagIcon,
    ArrowLeftIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function CouponUsage() {
    const [usages, setUsages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [coupons, setCoupons] = useState<any[]>([]);
    const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);

    useEffect(() => {
        loadCoupons();
    }, []);

    useEffect(() => {
        loadUsages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, selectedCouponId]);

    const loadCoupons = async () => {
        try {
            const response = await useCouponStore.list({});
            if (response.data?.status) {
                setCoupons(response.data.data?.data || []);
            }
        } catch (error) {
            console.error('Error loading coupons:', error);
        }
    };

    const loadUsages = async () => {
        try {
            setLoading(true);
            const requestData: any = {};
            
            if (selectedCouponId) {
                requestData.coupon_id = selectedCouponId;
            }
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useCouponStore.getAllUsages(requestData);
            
            if (response?.data?.status) {
                // Handle paginated response
                const responseData = response.data.data;
                let usagesData = [];
                
                if (responseData?.data && Array.isArray(responseData.data)) {
                    // Paginated response
                    usagesData = responseData.data;
                } else if (Array.isArray(responseData)) {
                    // Direct array response
                    usagesData = responseData;
                }
                
                setUsages(usagesData);
            } else {
                setUsages([]);
            }
        } catch (error: any) {
            console.error('Error loading usages:', error);
            setUsages([]);
            if (error.response?.data?.message) {
                console.error('API Error:', error.response.data.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const handleCouponFilter = (couponId: number | null) => {
        setSelectedCouponId(couponId);
    };

    const totalDiscount = usages.reduce((sum, usage) => sum + Number(usage.discount_amount || 0), 0);
    const totalOrders = usages.length;
    const totalRevenue = usages.reduce((sum, usage) => sum + Number(usage.order_total || 0), 0);

    return (
        <AdminLayout currentPath="/admin/coupons/usage">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/coupons"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Coupon Usage History</h1>
                            <p className="mt-1 text-sm text-gray-500">View all coupon code usage and statistics</p>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <TicketIcon className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ShoppingBagIcon className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Discount</p>
                                <p className="text-2xl font-bold text-gray-900">${totalDiscount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-shrink-0 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Coupon</label>
                            <select
                                value={selectedCouponId || ''}
                                onChange={(e) => handleCouponFilter(e.target.value ? parseInt(e.target.value) : null)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">All Coupons</option>
                                {coupons.map((coupon) => (
                                    <option key={coupon.id} value={coupon.id}>
                                        {coupon.code} - {coupon.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-shrink-0 min-w-[280px]">
                            <FormDatePicker
                                title="Filter by Date Range"
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

                {/* Usage Table */}
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
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Coupon Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usages.length > 0 ? (
                                    usages.map((usage: any) => (
                                        <tr key={usage.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(usage.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {usage.coupon_code_id || usage.coupon?.id || usage.couponCode?.id ? (
                                                    <Link
                                                        href={`/admin/coupons/${usage.coupon_code_id || usage.coupon?.id || usage.couponCode?.id}`}
                                                        className="text-sm font-mono font-semibold text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {usage.couponCode?.code || usage.coupon?.code || 'N/A'}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm font-mono font-semibold text-gray-900">
                                                        {usage.couponCode?.code || usage.coupon?.code || 'N/A'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {usage.user ? (
                                                    <Link
                                                        href={`/admin/users/${usage.user.id}`}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {usage.user.name || usage.user_email}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-gray-900">
                                                        {usage.user_name || usage.user_email || 'Guest'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {usage.order ? (
                                                    <Link
                                                        href={`/admin/orders/${usage.order.id}`}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        {usage.order.order_number || `#${usage.order.id}`}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm text-gray-500">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${Number(usage.order_total || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                -${Number(usage.discount_amount || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No usage found
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

