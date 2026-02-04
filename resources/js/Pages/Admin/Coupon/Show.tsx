import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useCouponStore } from './useCouponStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import { 
    ArrowLeftIcon,
    TicketIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function CouponShow() {
    const { props } = usePage();
    const couponId = (props as any).id;
    
    const [coupon, setCoupon] = useState<any>(null);
    const [usages, setUsages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingUsages, setLoadingUsages] = useState(false);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        if (couponId) {
            fetchCoupon();
            fetchUsages();
        }
    }, [couponId, dateRange]);

    const fetchCoupon = async () => {
        try {
            setLoading(true);
            const response = await useCouponStore.show({ id: couponId });
            if (response.data?.status && response.data?.data) {
                setCoupon(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching coupon:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsages = async () => {
        try {
            setLoadingUsages(true);
            const requestData: any = { id: couponId };
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useCouponStore.getUsages(requestData);
            if (response.data?.status) {
                setUsages(response.data.data?.data || []);
            }
        } catch (error) {
            console.error('Error fetching usages:', error);
        } finally {
            setLoadingUsages(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const getStatusBadge = (coupon: any) => {
        if (!coupon) return null;
        
        const now = new Date();
        const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
        const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
        
        if (!coupon.is_active) {
            return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        }
        
        if (startDate && now < startDate) {
            return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">Scheduled</span>;
        }
        
        if (endDate && now > endDate) {
            return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">Expired</span>;
        }
        
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">Limit Reached</span>;
        }
        
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    };

    const formatDiscount = (coupon: any) => {
        if (!coupon) return '';
        if (coupon.type === 'percentage') {
            return `${coupon.value}%`;
        }
        return `$${Number(coupon.value).toFixed(2)}`;
    };

    if (loading) {
        return (
            <AdminLayout currentPath="/admin/coupons">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!coupon) {
        return (
            <AdminLayout currentPath="/admin/coupons">
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg mb-4">Coupon not found</p>
                    <Link
                        href="/admin/coupons"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to Coupons
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentPath="/admin/coupons">
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
                            <h1 className="text-3xl font-bold text-gray-900">Coupon Details</h1>
                            <p className="mt-1 text-sm text-gray-500">View coupon information and usage history</p>
                        </div>
                    </div>
                    {getStatusBadge(coupon)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Coupon Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                                    <TicketIcon className="h-8 w-8 text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 font-mono">{coupon.code}</h2>
                                <p className="text-lg text-gray-600">{coupon.name}</p>
                            </div>

                            <div className="space-y-4 border-t border-gray-200 pt-6">
                                <div>
                                    <p className="text-xs text-gray-500">Discount</p>
                                    <p className="text-lg font-semibold text-indigo-600">{formatDiscount(coupon)}</p>
                                </div>

                                {coupon.description && (
                                    <div>
                                        <p className="text-xs text-gray-500">Description</p>
                                        <p className="text-sm font-medium text-gray-900">{coupon.description}</p>
                                    </div>
                                )}

                                {coupon.min_purchase_amount && (
                                    <div>
                                        <p className="text-xs text-gray-500">Min Purchase</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            ${Number(coupon.min_purchase_amount).toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                {coupon.max_discount_amount && (
                                    <div>
                                        <p className="text-xs text-gray-500">Max Discount</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            ${Number(coupon.max_discount_amount).toFixed(2)}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-gray-500">Usage</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {coupon.usage_count || 0}
                                        {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                                    </p>
                                </div>

                                {coupon.usage_limit_per_user && (
                                    <div>
                                        <p className="text-xs text-gray-500">Per User Limit</p>
                                        <p className="text-sm font-medium text-gray-900">{coupon.usage_limit_per_user}</p>
                                    </div>
                                )}

                                {coupon.start_date && (
                                    <div>
                                        <p className="text-xs text-gray-500">Start Date</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(coupon.start_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {coupon.end_date && (
                                    <div>
                                        <p className="text-xs text-gray-500">End Date</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(coupon.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Usage History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <ShoppingBagIcon className="h-6 w-6 mr-2" />
                                    Usage History ({usages.length})
                                </h2>
                                
                                {/* Date Filter */}
                                <div className="w-64">
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

                            {loadingUsages ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : usages.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Order
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Order Total
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Discount
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {usages.map((usage: any) => (
                                                <tr key={usage.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(usage.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
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
                                                    <td className="px-4 py-4 whitespace-nowrap">
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
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ${Number(usage.order_total || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                        -${Number(usage.discount_amount || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No usage found</h3>
                                    <p className="mt-1 text-sm text-gray-500">This coupon hasn't been used yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

