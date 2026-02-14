import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { XMarkIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline';
import { useCouponStore } from './useCouponStore';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';

export default function CouponUsageModal({
    isOpen,
    onClose,
    coupon,
}: any) {
    const [usages, setUsages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        if (isOpen && coupon?.id) {
            fetchUsages();
        }
    }, [isOpen, coupon?.id, dateRange]);

    const fetchUsages = async () => {
        if (!coupon?.id) return;
        
        try {
            setLoading(true);
            const requestData: any = { id: coupon.id };
            
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
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    if (!isOpen || !coupon) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Coupon Usage History
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {coupon.code} - {coupon.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Date Filter */}
                        <div className="mb-4">
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

                        {loading ? (
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
                                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-900 flex items-center"
                                                        >
                                                            <UserIcon className="h-4 w-4 mr-1" />
                                                            {usage.user.name || usage.user_email}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-sm text-gray-900 flex items-center">
                                                            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                            {usage.user_name || usage.user_email || 'Guest'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {usage.order ? (
                                                        <Link
                                                            href={`/admin/orders/${usage.order.id}`}
                                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-900 flex items-center"
                                                        >
                                                            <ShoppingBagIcon className="h-4 w-4 mr-1" />
                                                            {usage.order.order_number || `#${usage.order.id}`}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    ₹{Number(usage.order_total || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                    -₹{Number(usage.discount_amount || 0).toFixed(2)}
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

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

