import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useCouponStore } from './useCouponStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import CouponModal from './CouponModal';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    TicketIcon
} from '@heroicons/react/24/outline';

export default function CouponIndex() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCouponId, setDeleteCouponId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadCoupons();
    }, [dateRange]);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const requestData: any = {};
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useCouponStore.list(requestData);
            if (response.data?.status) {
                setCoupons(response.data.data?.data || []);
            }
        } catch (error) {
            console.error('Error loading coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const handleToggleStatus = async (couponId: number) => {
        try {
            const response = await useCouponStore.toggleStatus({ id: couponId });
            if (response.data?.status) {
                loadCoupons();
                toast({ message: 'Coupon status updated successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error toggling status:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update coupon status';
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleDeleteClick = (couponId: number) => {
        setDeleteCouponId(couponId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCouponId) return;
        
        try {
            const response = await useCouponStore.delete({ id: deleteCouponId });
            if (response.data?.status) {
                loadCoupons();
                setShowDeleteModal(false);
                setDeleteCouponId(null);
                toast({ message: 'Coupon deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete coupon');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting coupon:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete coupon';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCoupon(null);
    };

    const handleModalSuccess = () => {
        loadCoupons();
        setShowModal(false);
        setEditingCoupon(null);
    };

    const getStatusBadge = (coupon: any) => {
        const now = new Date();
        const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
        const endDate = coupon.end_date ? new Date(coupon.end_date) : null;
        
        if (!coupon.is_active) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
        }
        
        if (startDate && now < startDate) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Scheduled</span>;
        }
        
        if (endDate && now > endDate) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Expired</span>;
        }
        
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Limit Reached</span>;
        }
        
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    };

    const formatDiscount = (coupon: any) => {
        if (coupon.type === 'percentage') {
            return `${coupon.value}%`;
        }
        return `$${Number(coupon.value).toFixed(2)}`;
    };

    return (
        <AdminLayout currentPath="/admin/coupons">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage and monitor coupon codes</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCoupon(null);
                            setShowModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Coupon
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-3">
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
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valid Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {coupons.length > 0 ? (
                                    coupons.map((coupon: any) => (
                                        <tr key={coupon.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <TicketIcon className="h-5 w-5 text-indigo-500 mr-2" />
                                                    <span className="text-sm font-mono font-semibold text-gray-900">
                                                        {coupon.code}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{coupon.name}</div>
                                                {coupon.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {coupon.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-indigo-600">
                                                    {formatDiscount(coupon)}
                                                </span>
                                                {coupon.min_purchase_amount && (
                                                    <div className="text-xs text-gray-500">
                                                        Min: ${Number(coupon.min_purchase_amount).toFixed(2)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {coupon.usage_count || 0}
                                                    {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                                                </div>
                                                <Link
                                                    href={`/admin/coupons/${coupon.id}`}
                                                    className="text-xs text-indigo-600 hover:text-indigo-900"
                                                >
                                                    View Usage
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {coupon.start_date && (
                                                    <div>From: {new Date(coupon.start_date).toLocaleDateString()}</div>
                                                )}
                                                {coupon.end_date && (
                                                    <div>To: {new Date(coupon.end_date).toLocaleDateString()}</div>
                                                )}
                                                {!coupon.start_date && !coupon.end_date && (
                                                    <span className="text-gray-400">No limit</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(coupon)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center space-x-2">
                                                    <Link
                                                        href={`/admin/coupons/${coupon.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="h-5 w-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setEditingCoupon(coupon);
                                                            setShowModal(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(coupon.id)}
                                                        className={coupon.is_active ? "text-green-600 hover:text-green-900" : "text-gray-400 hover:text-gray-600"}
                                                        title={coupon.is_active ? "Deactivate" : "Activate"}
                                                    >
                                                        {coupon.is_active ? (
                                                            <CheckCircleIcon className="h-5 w-5" />
                                                        ) : (
                                                            <XCircleIcon className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(coupon.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No coupons found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Modal */}
                <CouponModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    coupon={editingCoupon}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteCouponId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Coupon"
                    message="Are you sure you want to delete this coupon? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmButtonColor="red"
                />

                {/* Alert Modal */}
                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    message={alertMessage}
                    type={alertType}
                />
            </div>
        </AdminLayout>
    );
}

