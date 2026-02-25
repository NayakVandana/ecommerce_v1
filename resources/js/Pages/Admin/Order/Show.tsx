import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useOrderStore } from './useOrderStore';
import { useDeliveryBoyStore } from './useDeliveryBoyStore';
import AdminLayout from '../Layout';
import toast from '../../../utils/toast';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import CancellationReasonModal from '../../../Components/CancellationReasonModal';
import { 
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    TruckIcon,
    ArrowPathIcon,
    UserIcon,
    FolderOpenIcon,
    PhotoIcon,
    VideoCameraIcon,
    DocumentArrowDownIcon,
    EyeIcon, 
    ChevronLeftIcon,
    ChevronRightIcon,
    PencilIcon,
    QrCodeIcon
} from '@heroicons/react/24/outline';

export default function OrderShow() {
    const { props, url } = usePage();
    const orderId = (props as any).id;
    // Get section from URL query parameter or props
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const sectionFromUrl = urlParams.get('section');
    const sectionFromProps = (props as any).section;
    // Normalize section - prefer URL param, then props, default to 'all'
    const section = sectionFromUrl || sectionFromProps || 'all';
    const normalizedSection = section === '' || !section ? 'all' : section;
    
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
    const [loadingDeliveryBoys, setLoadingDeliveryBoys] = useState(false);
    const [showDeliveryBoyModal, setShowDeliveryBoyModal] = useState(false);
    const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<number | null>(null);
    const [assigningDeliveryBoy, setAssigningDeliveryBoy] = useState(false);
    const [showDeliveryDateModal, setShowDeliveryDateModal] = useState(false);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [updatingDeliveryDate, setUpdatingDeliveryDate] = useState(false);
    const [mediaViewerIndex, setMediaViewerIndex] = useState<number | null>(null);
    const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
    const [paymentStatusForm, setPaymentStatusForm] = useState({
        payment_method: 'CASH_ON_DELIVERY',
        payment_type: 'CASH',
    });
    const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    useEffect(() => {
        if (showDeliveryBoyModal) {
            loadDeliveryBoys();
        }
    }, [showDeliveryBoyModal]);

    // Keyboard navigation for media viewer
    useEffect(() => {
        if (mediaViewerIndex === null || !order?.delivery_verification_media) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const newIndex = (mediaViewerIndex - 1 + order.delivery_verification_media.length) % order.delivery_verification_media.length;
                setMediaViewerIndex(newIndex);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const newIndex = (mediaViewerIndex + 1) % order.delivery_verification_media.length;
                setMediaViewerIndex(newIndex);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setMediaViewerIndex(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mediaViewerIndex, order?.delivery_verification_media]);

    const loadDeliveryBoys = async () => {
        try {
            setLoadingDeliveryBoys(true);
            const response = await useDeliveryBoyStore.getDeliveryBoys();
            if (response.data?.status) {
                setDeliveryBoys(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading delivery boys:', error);
        } finally {
            setLoadingDeliveryBoys(false);
        }
    };

    const handleAssignDeliveryBoy = async () => {
        if (!selectedDeliveryBoyId) {
            toast({ type: 'warning', message: 'Please select a delivery boy' });
            return;
        }

        try {
            setAssigningDeliveryBoy(true);
            const response = await useDeliveryBoyStore.assignDeliveryBoy({
                id: orderId,
                delivery_boy_id: selectedDeliveryBoyId,
            });

            if (response.data?.status) {
                await fetchOrder();
                setShowDeliveryBoyModal(false);
                setSelectedDeliveryBoyId(null);
                
                toast({ type: 'success', message: 'Delivery boy assigned successfully. Delivery boy can generate OTP from their dashboard.' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to assign delivery boy' });
            }
        } catch (error: any) {
            console.error('Error assigning delivery boy:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to assign delivery boy' });
        } finally {
            setAssigningDeliveryBoy(false);
        }
    };

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await useOrderStore.show({ id: orderId });
            if (response.data?.status && response.data?.data) {
                setOrder(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdateConfirm = async (newStatus: string) => {
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.updateStatus({
                id: orderId,
                status: newStatus,
            });
            
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: 'Order status updated successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to update order status' });
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to update order status' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleStatusUpdate = (newStatus: string) => {
        setConfirmMessage(`Are you sure you want to update order status to "${newStatus}"?`);
        setShowConfirm(true);
        setConfirmAction(() => () => handleStatusUpdateConfirm(newStatus));
    };

    const getStatusBadge = (status: string) => {
        const statusColors: any = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            'ready-for-shipping': 'bg-blue-100 text-blue-800',
            'out-for-delivery': 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
            'failed-delivery': 'bg-red-100 text-red-800',
            'picked-up': 'bg-green-100 text-green-800',
            'return-refund': 'bg-orange-100 text-orange-800',
        };

        const statusDisplay = status
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                statusColors[status] || 'bg-gray-100 text-gray-800'
            }`}>
                {statusDisplay}
            </span>
        );
    };

    const getBackUrl = () => {
        if (normalizedSection && normalizedSection !== 'all') {
            return `/admin/orders/${normalizedSection}`;
        }
        return '/admin/orders/all';
    };

    const getCurrentPath = () => {
        if (normalizedSection && normalizedSection !== 'all') {
            return `/admin/orders/${normalizedSection}`;
        }
        return '/admin/orders/all';
    };

    const getAvailableActions = () => {
        if (!order) return [];
        
        const currentStatus = order.status;
        const actions: any[] = [];

        switch (currentStatus) {
            case 'pending':
                actions.push(
                    { label: 'Accept Order', status: 'processing', color: 'green', icon: CheckCircleIcon },
                    { label: 'Reject Order', status: 'cancelled', color: 'red', icon: XCircleIcon }
                );
                break;
            case 'processing':
                actions.push(
                    { label: 'Mark as Shipped', status: 'shipped', color: 'blue', icon: TruckIcon }
                );
                break;
            case 'shipped':
                actions.push(
                    { label: 'Mark as Delivered', status: 'completed', color: 'green', icon: CheckCircleIcon },
                    { label: 'Mark Out for Delivery', status: 'shipped', color: 'indigo', icon: TruckIcon }
                );
                break;
            case 'completed':
                // No actions for completed orders - final state
                break;
            case 'cancelled':
                // For cancelled orders, allow retry if needed
                actions.push(
                    { label: 'Retry Order', status: 'pending', color: 'blue', icon: ArrowPathIcon }
                );
                break;
        }

        // Add return actions if return is pending
        if (order.return_status === 'pending') {
            actions.push(
                { label: 'Approve Return', status: 'approve_return', color: 'green', icon: CheckCircleIcon },
                { label: 'Reject Return', status: 'reject_return', color: 'red', icon: XCircleIcon }
            );
        } else if (order.return_status === 'approved') {
            actions.push(
                { label: 'Process Refund', status: 'process_refund', color: 'green', icon: CheckCircleIcon }
            );
        }

        // Add replacement actions if replacement is pending
        if (order.replacement_status === 'pending') {
            actions.push(
                { label: 'Approve Replacement', status: 'approve_replacement', color: 'blue', icon: CheckCircleIcon },
                { label: 'Reject Replacement', status: 'reject_replacement', color: 'red', icon: XCircleIcon }
            );
        } else if (order.replacement_status === 'approved') {
            actions.push(
                { label: 'Process Replacement', status: 'process_replacement', color: 'blue', icon: ArrowPathIcon }
            );
        }

        // Add "Mark as Delivered" for direct orders (available for multiple statuses)
        if (order.is_direct_order && 
            currentStatus !== 'delivered' && 
            currentStatus !== 'completed' && 
            currentStatus !== 'cancelled') {
            // Check if "Mark as Delivered" is not already in actions
            const hasDeliveredAction = actions.some(action => action.status === 'delivered' || action.status === 'completed');
            if (!hasDeliveredAction) {
                actions.push(
                    { label: 'Mark as Delivered', status: 'delivered', color: 'green', icon: CheckCircleIcon }
                );
            }
        }

        return actions;
    };

    const handleQuickAction = async (newStatus: string) => {
        if (newStatus === 'cancelled') {
            setShowCancelModal(true);
        } else if (newStatus === 'approve_return') {
            await handleApproveReturn();
        } else if (newStatus === 'reject_return') {
            await handleRejectReturn();
        } else if (newStatus === 'process_refund') {
            await handleProcessRefund();
        } else if (newStatus === 'approve_replacement') {
            await handleApproveReplacement();
        } else if (newStatus === 'reject_replacement') {
            await handleRejectReplacement();
        } else if (newStatus === 'process_replacement') {
            await handleProcessReplacement();
        } else {
            await handleStatusUpdate(newStatus);
        }
    };

    const handleApproveReturn = async (itemId?: number) => {
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.approveReturn({ 
                id: orderId,
                item_id: itemId
            });
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: itemId ? 'Item return approved successfully' : 'Return approved and refund processed successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to approve return' });
            }
        } catch (error: any) {
            console.error('Error approving return:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to approve return' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleRejectReturn = async (itemId?: number) => {
        const rejectionReason = prompt('Please enter rejection reason (optional):');
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.rejectReturn({ 
                id: orderId,
                item_id: itemId,
                rejection_reason: rejectionReason || null
            });
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: itemId ? 'Item return request rejected' : 'Return request rejected' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to reject return' });
            }
        } catch (error: any) {
            console.error('Error rejecting return:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to reject return' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleProcessRefund = async (itemId?: number) => {
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.processRefund({ 
                id: orderId,
                item_id: itemId
            });
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: itemId ? 'Item refund processed successfully' : 'Refund processed successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to process refund' });
            }
        } catch (error: any) {
            console.error('Error processing refund:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to process refund' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleApproveReplacement = async (itemId?: number) => {
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.approveReplacement({ 
                id: orderId,
                item_id: itemId
            });
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: itemId ? 'Item replacement approved and new order created successfully' : 'Replacement approved and new order created successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to approve replacement' });
            }
        } catch (error: any) {
            console.error('Error approving replacement:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to approve replacement' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleRejectReplacement = async (itemId?: number) => {
        const rejectionReason = prompt('Please enter rejection reason (optional):');
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.rejectReplacement({ 
                id: orderId,
                item_id: itemId,
                rejection_reason: rejectionReason || null
            });
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: itemId ? 'Item replacement request rejected' : 'Replacement request rejected' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to reject replacement' });
            }
        } catch (error: any) {
            console.error('Error rejecting replacement:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to reject replacement' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleProcessReplacement = async (itemId?: number) => {
        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.processReplacement({ 
                id: orderId,
                item_id: itemId
            });
            if (response.data?.status) {
                await fetchOrder();
                toast({ type: 'success', message: itemId ? 'Item replacement processed successfully' : 'Replacement processed successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to process replacement' });
            }
        } catch (error: any) {
            console.error('Error processing replacement:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to process replacement' });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleEditPaymentStatus = () => {
        if (order) {
            setPaymentStatusForm({
                payment_method: order.payment_method || 'CASH_ON_DELIVERY',
                payment_type: order.payment_type || 'CASH',
            });
            setShowPaymentStatusModal(true);
        }
    };

    const handleUpdatePaymentStatus = async () => {
        if (!order) return;
        
        try {
            setUpdatingPaymentStatus(true);
            const response = await useOrderStore.updatePaymentStatus({
                id: order.id,
                payment_method: paymentStatusForm.payment_method,
                payment_type: paymentStatusForm.payment_type,
            });
            
            if (response.data?.status) {
                await fetchOrder();
                setShowPaymentStatusModal(false);
                toast({ type: 'success', message: 'Payment status updated successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to update payment status' });
            }
        } catch (error: any) {
            console.error('Error updating payment status:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to update payment status' });
        } finally {
            setUpdatingPaymentStatus(false);
        }
    };

    const handleEditDeliveryDate = () => {
        if (order?.delivery_date) {
            const date = new Date(order.delivery_date);
            setDeliveryDate(date.toISOString().split('T')[0]);
        } else {
            // Default to 3 days from today
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 3);
            setDeliveryDate(defaultDate.toISOString().split('T')[0]);
        }
        setShowDeliveryDateModal(true);
    };

    const handleUpdateDeliveryDate = async () => {
        if (!deliveryDate) {
            toast({ type: 'error', message: 'Please select a delivery date' });
            return;
        }

        const selectedDate = new Date(deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            toast({ type: 'error', message: 'Delivery date cannot be in the past' });
            return;
        }

        try {
            setUpdatingDeliveryDate(true);
            const response = await useOrderStore.updateDeliveryDate({
                id: orderId,
                delivery_date: deliveryDate,
            });
            if (response.data?.status) {
                await fetchOrder();
                setShowDeliveryDateModal(false);
                toast({ type: 'success', message: 'Delivery date updated successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to update delivery date' });
            }
        } catch (error: any) {
            console.error('Error updating delivery date:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to update delivery date' });
        } finally {
            setUpdatingDeliveryDate(false);
        }
    };

    const handleCancelConfirm = async (cancelData: { cancellation_reason: string; cancellation_notes: string | null }) => {
        try {
            setCancelling(true);
            const response = await useOrderStore.cancel({
                id: orderId,
                cancellation_reason: cancelData.cancellation_reason,
                cancellation_notes: cancelData.cancellation_notes,
            });
            
            if (response.data?.status) {
                await fetchOrder();
                setShowCancelModal(false);
                toast({ type: 'success', message: 'Order cancelled successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to cancel order' });
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to cancel order' });
        } finally {
            setCancelling(false);
        }
    };

    const currentPath = getCurrentPath();

    if (loading) {
        return (
            <AdminLayout currentPath={currentPath}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!order) {
        return (
            <AdminLayout currentPath={currentPath}>
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg mb-4">Order not found</p>
                    <Link
                        href={getBackUrl()}
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to Orders
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const items = order.items || [];
    const subtotal = Number(order.subtotal || order.total || 0);
    const tax = Number(order.tax || 0);
    const shipping = Number(order.shipping || 0);
    const discount = Number(order.discount || 0);
    const total = Number(order.total || 0);


    return (
        <AdminLayout currentPath={currentPath}>
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <Link
                        href={getBackUrl()}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Back to Orders
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Details</h1>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600">
                                Order #{order.order_number || order.id}
                            </p>
                            {order.status === 'cancelled' && order.cancellation_reason && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md max-w-2xl">
                                    <p className="text-sm font-semibold text-red-900 mb-1">Cancellation Reason:</p>
                                    <p className="text-sm text-red-800">
                                        {order.cancellation_reason === 'changed_mind' && 'Changed My Mind'}
                                        {order.cancellation_reason === 'found_better_price' && 'Found Better Price Elsewhere'}
                                        {order.cancellation_reason === 'wrong_item' && 'Wrong Item Ordered'}
                                        {order.cancellation_reason === 'delivery_address_incorrect' && 'Delivery Address Incorrect'}
                                        {order.cancellation_reason === 'delayed_delivery' && 'Delivery Taking Too Long'}
                                        {order.cancellation_reason === 'customer_request' && 'Customer Request'}
                                        {order.cancellation_reason === 'out_of_stock' && 'Out of Stock'}
                                        {order.cancellation_reason === 'payment_failed' && 'Payment Failed'}
                                        {order.cancellation_reason === 'delivery_issue' && 'Delivery Issue'}
                                        {order.cancellation_reason === 'other' && 'Other'}
                                    </p>
                                    {order.cancellation_notes && (
                                        <p className="text-sm text-red-700 mt-2 italic">"{order.cancellation_notes}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <div className="flex justify-center sm:justify-start">
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <a
                                    href={`/admin/orders/${order.id}/qr-code`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                                >
                                    <QrCodeIcon className="h-4 w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Generate QR Code</span>
                                    <span className="sm:hidden">QR Code</span>
                                </a>
                                <a
                                    href={`/admin/orders/${order.id}/invoice`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    <EyeIcon className="h-4 w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">View Invoice</span>
                                    <span className="sm:hidden">Invoice</span>
                                </a>
                                <a
                                    href={`/admin/orders/${order.id}/invoice/download`}
                                    className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                                >
                                    <DocumentArrowDownIcon className="h-4 w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Download PDF</span>
                                    <span className="sm:hidden">PDF</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    {getAvailableActions().length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {getAvailableActions().map((action: any, index: number) => {
                                const Icon = action.icon;
                                const colorClasses: any = {
                                    green: 'bg-green-600 hover:bg-green-700 text-white',
                                    red: 'bg-red-600 hover:bg-red-700 text-white',
                                    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
                                    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                                };
                                
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickAction(action.status)}
                                        disabled={updatingStatus}
                                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                            colorClasses[action.color] || 'bg-gray-600 hover:bg-gray-700 text-white'
                                        } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {action.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Order Timeline */}
                <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Order Timeline</h2>
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        
                        <div className="space-y-6">
                            {/* Ordered */}
                            <div className="relative flex items-start">
                                <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center z-10 ${
                                    order.created_at ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                    <CheckCircleIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                        order.created_at ? 'text-white' : 'text-gray-500'
                                    }`} />
                                </div>
                                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                        <h3 className={`text-xs sm:text-sm font-semibold ${
                                            order.created_at ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                            Order Placed
                                        </h3>
                                        {order.created_at && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Order #{order.order_number || order.id} was successfully placed
                                    </p>
                                </div>
                            </div>

                            {/* Under Process */}
                            <div className="relative flex items-start">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                    order.processing_at ? 'bg-blue-500' : 'bg-gray-300'
                                }`}>
                                    <ArrowPathIcon className={`h-5 w-5 ${
                                        order.processing_at ? 'text-white' : 'text-gray-500'
                                    }`} />
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-sm font-semibold ${
                                            order.processing_at ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                            Under Process
                                        </h3>
                                        {order.processing_at && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.processing_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Order is being processed and prepared for shipment
                                    </p>
                                </div>
                            </div>

                            {/* Shipped */}
                            <div className="relative flex items-start">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                    order.shipped_at ? 'bg-purple-500' : 'bg-gray-300'
                                }`}>
                                    <TruckIcon className={`h-5 w-5 ${
                                        order.shipped_at ? 'text-white' : 'text-gray-500'
                                    }`} />
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-sm font-semibold ${
                                            order.shipped_at ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                            Shipped
                                        </h3>
                                        {order.shipped_at && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.shipped_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Order has been shipped and is on its way
                                    </p>
                                </div>
                            </div>

                            {/* Out for Delivery */}
                            <div className="relative flex items-start">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                    order.out_for_delivery_at ? 'bg-indigo-500' : 'bg-gray-300'
                                }`}>
                                    <TruckIcon className={`h-5 w-5 ${
                                        order.out_for_delivery_at ? 'text-white' : 'text-gray-500'
                                    }`} />
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-sm font-semibold ${
                                            order.out_for_delivery_at ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                            Out for Delivery
                                        </h3>
                                        {order.out_for_delivery_at && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.out_for_delivery_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Order is out for delivery
                                    </p>
                                </div>
                            </div>

                            {/* Delivered */}
                            {order.delivered_at && (
                                <div className="relative flex items-start">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 bg-green-600">
                                        <CheckCircleIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                Delivered
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.delivered_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Order has been successfully delivered
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Cancelled */}
                            {order.cancelled_at && (
                                <div className="relative flex items-start">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 bg-red-500">
                                        <XCircleIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                Cancelled
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.cancelled_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Order has been cancelled
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Status Overview */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h2>
                            <div className="space-y-4">
                                {/* Main Order Status */}
                                <div className="pb-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-gray-700">Order Status</p>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Order Date</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(order.created_at).toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Order Number</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {order.order_number || `#${order.id}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Status */}
                                <div className="pb-4 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Delivery Information</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Expected Delivery Date</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {order.delivery_date ? (
                                                    <>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {new Date(order.delivery_date).toLocaleDateString('en-US', { 
                                                                weekday: 'long', 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </p>
                                                        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'completed' && (
                                                            <button
                                                                onClick={() => handleEditDeliveryDate()}
                                                                className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-1"
                                                                title="Change Delivery Date"
                                                            >
                                                                <TruckIcon className="h-3 w-3" />
                                                                Edit
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handleEditDeliveryDate()}
                                                            className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-1"
                                                            title="Set Delivery Date"
                                                        >
                                                            <TruckIcon className="h-3 w-3" />
                                                            Set Date
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        {order.delivered_at && (
                                            <div>
                                                <p className="text-xs text-gray-500">Delivered Date</p>
                                                <p className="text-sm font-medium text-green-600">
                                                    {new Date(order.delivered_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {order.shipped_at && (
                                            <div>
                                                <p className="text-xs text-gray-500">Shipped Date</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(order.shipped_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {order.out_for_delivery_at && (
                                            <div>
                                                <p className="text-xs text-gray-500">Out for Delivery</p>
                                                <p className="text-sm font-medium text-indigo-600">
                                                    {new Date(order.out_for_delivery_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cancellation Status */}
                                {order.status === 'cancelled' && order.cancellation_reason && (
                                    <div className="pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <XCircleIcon className="h-5 w-5 text-red-600" />
                                            <p className="text-sm font-semibold text-gray-700">Cancellation Information</p>
                                        </div>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-sm font-semibold text-red-900 mb-2">Order Cancelled</p>
                                            <p className="text-sm text-red-800 mb-2">
                                                {order.cancellation_reason === 'changed_mind' && 'Changed My Mind'}
                                                {order.cancellation_reason === 'found_better_price' && 'Found Better Price Elsewhere'}
                                                {order.cancellation_reason === 'wrong_item' && 'Wrong Item Ordered'}
                                                {order.cancellation_reason === 'delivery_address_incorrect' && 'Delivery Address Incorrect'}
                                                {order.cancellation_reason === 'delayed_delivery' && 'Delivery Taking Too Long'}
                                                {order.cancellation_reason === 'customer_request' && 'Customer Request'}
                                                {order.cancellation_reason === 'out_of_stock' && 'Out of Stock'}
                                                {order.cancellation_reason === 'payment_failed' && 'Payment Failed'}
                                                {order.cancellation_reason === 'delivery_issue' && 'Delivery Issue'}
                                                {order.cancellation_reason === 'other' && 'Other'}
                                            </p>
                                            {order.cancellation_notes && (
                                                <p className="text-sm text-red-700 mb-2 italic">"{order.cancellation_notes}"</p>
                                            )}
                                            {order.cancelled_at && (
                                                <div className="mt-2 pt-2 border-t border-red-200">
                                                    <p className="text-xs text-red-600 font-semibold">Cancelled On</p>
                                                    <p className="text-xs text-red-700">
                                                        {new Date(order.cancelled_at).toLocaleString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Return/Refund Status */}
                                {order.return_status && (
                                    <div className="pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ArrowPathIcon className="h-5 w-5 text-orange-600" />
                                            <p className="text-sm font-semibold text-gray-700">Return/Refund Status</p>
                                        </div>
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-semibold text-orange-900">
                                                    {order.return_status === 'pending' && '⏳ Return Request Pending'}
                                                    {order.return_status === 'approved' && '✅ Return Approved - Refund Processing'}
                                                    {order.return_status === 'rejected' && '❌ Return Request Rejected'}
                                                    {order.return_status === 'refunded' && '💰 Refund Processed'}
                                                </p>
                                            </div>
                                            {order.return_reason && (
                                                <p className="text-sm text-orange-700 mb-2">
                                                    <span className="font-semibold">Reason:</span> 
                                                    {order.return_reason === 'defective_item' && ' Defective Item'}
                                                    {order.return_reason === 'wrong_item' && ' Wrong Item Received'}
                                                    {order.return_reason === 'not_as_described' && ' Not as Described'}
                                                    {order.return_reason === 'changed_mind' && ' Changed My Mind'}
                                                    {order.return_reason === 'damaged_during_delivery' && ' Damaged During Delivery'}
                                                    {order.return_reason === 'other' && ' Other'}
                                                </p>
                                            )}
                                            {order.return_notes && (
                                                <p className="text-sm text-orange-700 mb-2 italic">"{order.return_notes}"</p>
                                            )}
                                            {order.refund_amount && (
                                                <p className="text-sm font-semibold text-orange-900 mb-2">
                                                    Refund Amount: ₹{Number(order.refund_amount).toFixed(2)}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-orange-200">
                                                {order.return_requested_at && (
                                                    <div>
                                                        <p className="text-xs text-orange-600 font-semibold">Requested</p>
                                                        <p className="text-xs text-orange-700">
                                                            {new Date(order.return_requested_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {order.return_processed_at && (
                                                    <div>
                                                        <p className="text-xs text-orange-600 font-semibold">Processed</p>
                                                        <p className="text-xs text-orange-700">
                                                            {new Date(order.return_processed_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Replacement Status */}
                                {order.replacement_status && (
                                    <div className="pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                                            <p className="text-sm font-semibold text-gray-700">Replacement Status</p>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-semibold text-blue-900">
                                                    {order.replacement_status === 'pending' && '⏳ Replacement Request Pending'}
                                                    {order.replacement_status === 'approved' && '✅ Replacement Approved - New Order Created'}
                                                    {order.replacement_status === 'rejected' && '❌ Replacement Request Rejected'}
                                                    {order.replacement_status === 'processed' && '✅ Replacement Processed'}
                                                </p>
                                            </div>
                                            {order.replacement_reason && (
                                                <p className="text-sm text-blue-700 mb-2">
                                                    <span className="font-semibold">Reason:</span> 
                                                    {order.replacement_reason === 'defective_item' && ' Defective Item'}
                                                    {order.replacement_reason === 'wrong_item' && ' Wrong Item Received'}
                                                    {order.replacement_reason === 'not_as_described' && ' Not as Described'}
                                                    {order.replacement_reason === 'damaged_during_delivery' && ' Damaged During Delivery'}
                                                    {order.replacement_reason === 'other' && ' Other'}
                                                </p>
                                            )}
                                            {order.replacement_notes && (
                                                <p className="text-sm text-blue-700 mb-2 italic">"{order.replacement_notes}"</p>
                                            )}
                                            {order.replacement_order_id && order.replacement_order && (
                                                <div className="mb-2">
                                                    <p className="text-sm font-semibold text-blue-900 mb-1">Replacement Order:</p>
                                                    <Link
                                                        href={`/admin/orders/${order.replacement_order.id}/show`}
                                                        className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                                                    >
                                                        Order #{order.replacement_order.order_number || order.replacement_order.id}
                                                    </Link>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-blue-200">
                                                {order.replacement_requested_at && (
                                                    <div>
                                                        <p className="text-xs text-blue-600 font-semibold">Requested</p>
                                                        <p className="text-xs text-blue-700">
                                                            {new Date(order.replacement_requested_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                                {order.replacement_processed_at && (
                                                    <div>
                                                        <p className="text-xs text-blue-600 font-semibold">Processed</p>
                                                        <p className="text-xs text-blue-700">
                                                            {new Date(order.replacement_processed_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Processing Timeline */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Processing Timeline</p>
                                    <div className="space-y-2">
                                        {order.processing_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Processing Started</span>
                                                <span className="text-gray-900 font-medium">
                                                    {new Date(order.processing_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {order.shipped_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Shipped</span>
                                                <span className="text-gray-900 font-medium">
                                                    {new Date(order.shipped_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {order.out_for_delivery_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Out for Delivery</span>
                                                <span className="text-gray-900 font-medium">
                                                    {new Date(order.out_for_delivery_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {order.delivered_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Delivered</span>
                                                <span className="text-green-600 font-medium">
                                                    {new Date(order.delivered_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {order.cancelled_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Cancelled</span>
                                                <span className="text-red-600 font-medium">
                                                    {new Date(order.cancelled_at).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Customer Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="text-sm font-medium text-gray-900 break-words">{order.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900 break-all">{order.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{order.phone}</p>
                                </div>
                                {order.user && (
                                    <div>
                                        <p className="text-xs text-gray-500">User Account</p>
                                        <p className="text-sm font-medium text-gray-900 break-words">
                                            {order.user.name} <span className="text-xs text-gray-500">({order.user.email})</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Shipping Address</h2>
                            <div className="text-sm text-gray-900 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p><span className="font-semibold">Name:</span> {order.name}</p>
                                        <p><span className="font-semibold">Email:</span> {order.email}</p>
                                        {order.receiver_name && (
                                            <p><span className="font-semibold">Receiver Name:</span> {order.receiver_name}</p>
                                        )}
                                        <p><span className="font-semibold">Receiver Number:</span> {order.receiver_number || order.phone}</p>
                                    </div>
                                    <div>
                                        {order.address_type && (
                                            <p>
                                                <span className="font-semibold">Address Type:</span>{' '}
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                                                    {order.address_type === 'home' ? 'Home' : order.address_type === 'office' ? 'Office' : 'Other'}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t">
                                    <p className="font-semibold mb-2">Address Details:</p>
                                    <p>{order.address}</p>
                                    {order.house_no && (
                                        <p><span className="font-semibold">House No:</span> {order.house_no}</p>
                                    )}
                                    {order.floor_no && (
                                        <p><span className="font-semibold">Floor No:</span> {order.floor_no}</p>
                                    )}
                                    {order.building_name && (
                                        <p><span className="font-semibold">Building/Apartment:</span> {order.building_name}</p>
                                    )}
                                    {order.landmark && (
                                        <p><span className="font-semibold">Landmark/Area:</span> {order.landmark}</p>
                                    )}
                                </div>
                                
                                <div className="pt-2 border-t">
                                    <p className="font-semibold mb-2">Location:</p>
                                    {order.district && (
                                        <p><span className="font-semibold">District:</span> {order.district}</p>
                                    )}
                                    <p><span className="font-semibold">City:</span> {order.city}</p>
                                    <p><span className="font-semibold">Postal Code:</span> {order.postal_code}</p>
                                    {order.state && (
                                        <p><span className="font-semibold">State:</span> {order.state}</p>
                                    )}
                                    <p><span className="font-semibold">Country:</span> {order.country}</p>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-gray-700">Payment Information</h3>
                                        <button
                                            onClick={handleEditPaymentStatus}
                                            className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                            title="Edit Payment Status"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p>
                                            <span className="font-semibold">Payment Method:</span>{' '}
                                            <span className="capitalize">{
                                                (() => {
                                                    const labels: any = {
                                                        'CASH_ON_DELIVERY': 'Cash on Delivery',
                                                        'ONLINE_PAYMENT': 'Online Payment',
                                                        'BANK_TRANSFER': 'Bank Transfer',
                                                        'UPI': 'UPI',
                                                        'CREDIT_CARD': 'Credit Card',
                                                        'DEBIT_CARD': 'Debit Card',
                                                        'WALLET': 'Wallet',
                                                        'OTHER': 'Other',
                                                    };
                                                    return labels[order.payment_method] || order.payment_method || 'Cash on Delivery';
                                                })()
                                            }</span>
                                        </p>
                                        <p>
                                            <span className="font-semibold">Payment Type:</span>{' '}
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                order.payment_type === 'CASH' ? 'bg-green-100 text-green-800' :
                                                order.payment_type === 'ONLINE' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {(() => {
                                                    const labels: any = {
                                                        'CASH': 'Cash',
                                                        'ONLINE': 'Online',
                                                        'OTHER': 'Other',
                                                    };
                                                    return labels[order.payment_type] || order.payment_type || 'Cash';
                                                })()}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Boy Assignment */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Delivery Assignment</h2>
                                {!order.delivery_boy_id && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeliveryBoyModal(true)}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <UserIcon className="h-4 w-4 mr-2" />
                                        Assign Delivery Boy
                                    </button>
                                )}
                            </div>
                            
                            {order.delivery_boy ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{order.delivery_boy.name}</p>
                                            <p className="text-xs text-gray-500">{order.delivery_boy.email}</p>
                                            {order.delivery_boy.phone && (
                                                <p className="text-xs text-gray-500">Phone: {order.delivery_boy.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    {order.otp_code && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-xs text-gray-500 mb-1">Delivery OTP</p>
                                            <p className="text-lg font-mono font-bold text-indigo-600">{order.otp_code}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {order.otp_verified ? (
                                                    <span className="text-green-600">✓ Verified</span>
                                                ) : (
                                                    <span>Pending verification</span>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No delivery boy assigned yet</p>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Items</h2>
                            <div className="space-y-4">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    
                                    // Item-level return/replacement status
                                    const hasReturnStatus = item.return_status;
                                    const hasReplacementStatus = item.replacement_status;
                                    
                                    return (
                                        <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4 border-b last:border-b-0">
                                            <div className="flex-shrink-0 flex justify-center sm:justify-start">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded overflow-hidden">
                                                    {imageUrl ? (
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={item.product_name || product?.product_name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs flex items-center justify-center h-full">No Image</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-sm break-words">
                                                    {item.product_name || product?.product_name}
                                                </h3>
                                                {item.product_sku && (
                                                    <p className="text-xs text-gray-500 break-all">SKU: {item.product_sku}</p>
                                                )}
                                                {(item.size || item.color) && (
                                                    <p className="text-xs text-gray-500">
                                                        {item.size && `Size: ${item.size} `}
                                                        {item.color && `Color: ${item.color}`}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Quantity: {item.quantity} × ₹{Number(item.price || 0).toFixed(2)}
                                                </p>
                                                {/* Return/Replace Eligibility Badges */}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {item.is_returnable !== false ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            ✓ Returnable
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            ✗ Not Returnable
                                                        </span>
                                                    )}
                                                    {item.is_replaceable !== false ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            🔄 Replaceable
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            ✗ Not Replaceable
                                                        </span>
                                                    )}
                                                    
                                                    {/* Item Return Status */}
                                                    {item.return_status && (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                            item.return_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            item.return_status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            item.return_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {item.return_status === 'pending' && '⏳ Return Pending'}
                                                            {item.return_status === 'approved' && '✅ Return Approved'}
                                                            {item.return_status === 'rejected' && '❌ Return Rejected'}
                                                            {item.return_status === 'refunded' && '💰 Refunded'}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Item Replacement Status */}
                                                    {item.replacement_status && (
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                            item.replacement_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            item.replacement_status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            item.replacement_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {item.replacement_status === 'pending' && '⏳ Replacement Pending'}
                                                            {item.replacement_status === 'approved' && '✅ Replacement Approved'}
                                                            {item.replacement_status === 'rejected' && '❌ Replacement Rejected'}
                                                            {item.replacement_status === 'processed' && '✅ Replacement Processed'}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Item Return/Replacement Details */}
                                                {(hasReturnStatus || hasReplacementStatus) && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                                        {item.return_status && (
                                                            <div className="text-xs">
                                                                <span className="font-semibold text-orange-700">Return:</span>
                                                                <span className="text-gray-600 ml-1">
                                                                    {item.return_reason && (
                                                                        item.return_reason === 'defective_item' ? 'Defective Item' :
                                                                        item.return_reason === 'wrong_item' ? 'Wrong Item' :
                                                                        item.return_reason === 'not_as_described' ? 'Not as Described' :
                                                                        item.return_reason === 'changed_mind' ? 'Changed Mind' :
                                                                        item.return_reason === 'damaged_during_delivery' ? 'Damaged' :
                                                                        'Other'
                                                                    )}
                                                                </span>
                                                                {item.return_requested_at && (
                                                                    <span className="text-gray-500 ml-2">
                                                                        ({new Date(item.return_requested_at).toLocaleDateString()})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {item.replacement_status && (
                                                            <div className="text-xs">
                                                                <span className="font-semibold text-blue-700">Replacement:</span>
                                                                <span className="text-gray-600 ml-1">
                                                                    {item.replacement_reason && (
                                                                        item.replacement_reason === 'defective_item' ? 'Defective Item' :
                                                                        item.replacement_reason === 'wrong_item' ? 'Wrong Item' :
                                                                        item.replacement_reason === 'not_as_described' ? 'Not as Described' :
                                                                        item.replacement_reason === 'damaged_during_delivery' ? 'Damaged' :
                                                                        'Other'
                                                                    )}
                                                                </span>
                                                                {item.replacement_requested_at && (
                                                                    <span className="text-gray-500 ml-2">
                                                                        ({new Date(item.replacement_requested_at).toLocaleDateString()})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Item-level Action Buttons */}
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {item.return_status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApproveReturn(item.id)}
                                                                        disabled={updatingStatus}
                                                                        className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                                                                    >
                                                                        Approve Return
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectReturn(item.id)}
                                                                        disabled={updatingStatus}
                                                                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                                                                    >
                                                                        Reject Return
                                                                    </button>
                                                                </>
                                                            )}
                                                            {item.return_status === 'approved' && (
                                                                <button
                                                                    onClick={() => handleProcessRefund(item.id)}
                                                                    disabled={updatingStatus}
                                                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                                                                >
                                                                    Process Refund
                                                                </button>
                                                            )}
                                                            {item.replacement_status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApproveReplacement(item.id)}
                                                                        disabled={updatingStatus}
                                                                        className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                                                                    >
                                                                        Approve Replacement
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectReplacement(item.id)}
                                                                        disabled={updatingStatus}
                                                                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                                                                    >
                                                                        Reject Replacement
                                                                    </button>
                                                                </>
                                                            )}
                                                            {item.replacement_status === 'approved' && (
                                                                <button
                                                                    onClick={() => handleProcessReplacement(item.id)}
                                                                    disabled={updatingStatus}
                                                                    className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                                                                >
                                                                    Process Replacement
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-indigo-600">
                                                    ₹{Number(item.subtotal || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Open Box Delivery Verification */}
                        {(order.delivery_verification_media && order.delivery_verification_media.length > 0) || 
                         (order.status === 'out_for_delivery' || order.status === 'delivered') ? (
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FolderOpenIcon className="h-6 w-6 text-green-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Open Box Delivery Verification</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Photos and videos captured by the delivery boy during box opening verification
                                </p>
                                
                                {order.delivery_verification_media && order.delivery_verification_media.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {order.delivery_verification_media.map((media: any) => {
                                            const mediaUrl = media.url || (media.file_path ? `/storage/${media.file_path}` : '');
                                            return (
                                                <div key={media.id} className="relative group">
                                                    {media.type === 'video' ? (
                                                        <div className="relative">
                                                            <video
                                                                src={mediaUrl}
                                                                className="w-full h-40 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => {
                                                                    if (mediaUrl) {
                                                                        const index = order.delivery_verification_media.findIndex((m: any) => m.id === media.id);
                                                                        setMediaViewerIndex(index >= 0 ? index : 0);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                                                <VideoCameraIcon className="h-3 w-3" />
                                                                Video
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <img
                                                                src={mediaUrl || '/placeholder-image.png'}
                                                                alt="Open box verification"
                                                                className="w-full h-40 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                                }}
                                                                onClick={() => {
                                                                    if (mediaUrl) {
                                                                        const index = order.delivery_verification_media.findIndex((m: any) => m.id === media.id);
                                                                        setMediaViewerIndex(index >= 0 ? index : 0);
                                                                    }
                                                                }}
                                                            />
                                                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                                                <PhotoIcon className="h-3 w-3" />
                                                                Photo
                                                            </div>
                                                        </div>
                                                    )}
                                                    {media.description && (
                                                        <p className="text-xs text-gray-600 mt-1 truncate" title={media.description}>
                                                            {media.description}
                                                        </p>
                                                    )}
                                                    {media.order_item && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Item: {media.order_item.product_name || 'N/A'}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(media.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                        <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">
                                            No verification media has been uploaded yet
                                        </p>
                                        {order.status === 'out_for_delivery' && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                The delivery boy can upload verification photos/videos from their dashboard
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {order.notes && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes</h2>
                                <p className="text-sm text-gray-900">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg p-6 sticky top-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && order.coupon_code && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Discount ({order.coupon_code.code})</span>
                                        <span className="text-green-600">-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-gray-900">₹{shipping.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-900">Total</span>
                                    <span className="font-bold text-lg text-indigo-600">₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => {
                    setShowConfirm(false);
                    setConfirmAction(null);
                }}
                onConfirm={() => {
                    if (confirmAction) {
                        confirmAction();
                        setConfirmAction(null);
                    }
                }}
                title="Update Order Status"
                message={confirmMessage}
                confirmText="Update"
                cancelText="Cancel"
                confirmButtonColor="indigo"
            />

            <CancellationReasonModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelConfirm}
                loading={cancelling}
            />

            {/* Delivery Boy Assignment Modal */}
            {showDeliveryBoyModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => setShowDeliveryBoyModal(false)}
                        ></div>

                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full mx-4 sm:mx-auto sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Assign Delivery Boy</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeliveryBoyModal(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>

                                {loadingDeliveryBoys ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <p className="mt-2 text-sm text-gray-500">Loading delivery boys...</p>
                                    </div>
                                ) : deliveryBoys.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No delivery boys available</p>
                                        <p className="text-sm text-gray-400 mt-2">Please create delivery boy users first</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Delivery Boy
                                        </label>
                                        <select
                                            value={selectedDeliveryBoyId || ''}
                                            onChange={(e) => setSelectedDeliveryBoyId(Number(e.target.value))}
                                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="">-- Select Delivery Boy --</option>
                                            {deliveryBoys.map((boy: any) => (
                                                <option key={boy.id} value={boy.id}>
                                                    {boy.name} ({boy.email}) {boy.phone ? `- ${boy.phone}` : ''}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={handleAssignDeliveryBoy}
                                                disabled={!selectedDeliveryBoyId || assigningDeliveryBoy}
                                                className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                            >
                                                {assigningDeliveryBoy ? 'Assigning...' : 'Assign'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowDeliveryBoyModal(false);
                                                    setSelectedDeliveryBoyId(null);
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Date Modal */}
            {showDeliveryDateModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => setShowDeliveryDateModal(false)}
                        ></div>

                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full mx-4 sm:mx-auto sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Update Delivery Date</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeliveryDateModal(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]} // Today
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Select today's date or a future date for delivery
                                    </p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleUpdateDeliveryDate}
                                        disabled={updatingDeliveryDate || !deliveryDate}
                                        className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {updatingDeliveryDate ? 'Updating...' : 'Update Date'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeliveryDateModal(false)}
                                        disabled={updatingDeliveryDate}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Media Gallery Viewer */}
            {mediaViewerIndex !== null && order.delivery_verification_media && order.delivery_verification_media.length > 0 && (() => {
                const currentMedia = order.delivery_verification_media[mediaViewerIndex];
                if (!currentMedia) return null;
                
                const mediaUrl = currentMedia.url || (currentMedia.file_path ? `/storage/${currentMedia.file_path}` : '');
                const isVideo = currentMedia.type === 'video';
                const totalMedia = order.delivery_verification_media.length;
                
                const navigateMedia = (direction: 'prev' | 'next') => {
                    if (mediaViewerIndex === null) return;
                    
                    let newIndex = mediaViewerIndex;
                    if (direction === 'next') {
                        newIndex = (newIndex + 1) % totalMedia;
                    } else {
                        newIndex = (newIndex - 1 + totalMedia) % totalMedia;
                    }
                    setMediaViewerIndex(newIndex);
                };

                return (
                    <div 
                        className="fixed inset-0 z-[10000] bg-black bg-opacity-100 flex items-center justify-center"
                        onClick={() => setMediaViewerIndex(null)}
                        tabIndex={-1}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setMediaViewerIndex(null)}
                            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-3 transition-colors"
                            aria-label="Close"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>

                        {/* Media Counter */}
                        <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                            <span className="text-sm font-medium">
                                {mediaViewerIndex + 1} / {totalMedia}
                            </span>
                        </div>

                        {/* Main Media Display */}
                        <div 
                            className="relative w-full h-full flex items-center justify-center"
                            style={{ padding: '80px 16px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isVideo ? (
                                <video
                                    src={mediaUrl}
                                    controls
                                    autoPlay
                                    className="fullscreen-media-viewer"
                                    style={{ 
                                        maxHeight: 'calc(100vh - 80px)', 
                                        maxWidth: '100%',
                                        width: 'auto', 
                                        height: 'auto',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : (
                                <img
                                    src={mediaUrl || '/placeholder-image.png'}
                                    alt="Verification media"
                                    className="fullscreen-media-viewer"
                                    style={{ 
                                        maxHeight: 'calc(100vh - 80px)', 
                                        maxWidth: '100%',
                                        width: 'auto', 
                                        height: 'auto',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                    }}
                                />
                            )}

                            {/* Navigation Arrows */}
                            {totalMedia > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateMedia('prev');
                                        }}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all backdrop-blur-sm"
                                        aria-label="Previous"
                                    >
                                        <ChevronLeftIcon className="h-8 w-8" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateMedia('next');
                                        }}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all backdrop-blur-sm"
                                        aria-label="Next"
                                    >
                                        <ChevronRightIcon className="h-8 w-8" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Media Info */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg max-w-2xl w-full mx-4">
                            <div className="text-center">
                                {currentMedia.description && (
                                    <p className="text-sm mb-1">
                                        <span className="font-semibold">Description:</span> {currentMedia.description}
                                    </p>
                                )}
                                {currentMedia.order_item && (
                                    <p className="text-xs text-gray-300 mb-1">
                                        <span className="font-semibold">Item:</span> {currentMedia.order_item.product_name || 'N/A'}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400">
                                    {new Date(currentMedia.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Thumbnail Strip */}
                        {totalMedia > 1 && (
                            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 overflow-x-auto px-4 pb-2 max-w-4xl">
                                {order.delivery_verification_media.map((m: any, idx: number) => {
                                    const thumbUrl = m.url || (m.file_path ? `/storage/${m.file_path}` : '/placeholder-image.png');
                                    return (
                                        <button
                                            key={idx}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMediaViewerIndex(idx);
                                            }}
                                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                                                idx === mediaViewerIndex 
                                                    ? 'border-white scale-110' 
                                                    : 'border-gray-600 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            {m.type === 'video' ? (
                                                <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                                                    <video
                                                        src={thumbUrl}
                                                        className="w-full h-full object-cover opacity-50"
                                                    />
                                                    <VideoCameraIcon className="absolute h-4 w-4 text-white" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={thumbUrl}
                                                    alt={`Thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })()}

                {/* Payment Status Edit Modal */}
                {showPaymentStatusModal && order && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                onClick={() => setShowPaymentStatusModal(false)}
                            ></div>

                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Edit Payment Status</h3>
                                        <button
                                            onClick={() => setShowPaymentStatusModal(false)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600">
                                            Order: <span className="font-medium">{order.order_number || `#${order.id}`}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Method *
                                            </label>
                                            <select
                                                value={paymentStatusForm.payment_method}
                                                onChange={(e) => setPaymentStatusForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                                                <option value="ONLINE_PAYMENT">Online Payment</option>
                                                <option value="BANK_TRANSFER">Bank Transfer</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CREDIT_CARD">Credit Card</option>
                                                <option value="DEBIT_CARD">Debit Card</option>
                                                <option value="WALLET">Wallet</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Payment Type *
                                            </label>
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatusForm(prev => ({ ...prev, payment_type: 'CASH' }))}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                        paymentStatusForm.payment_type === 'CASH'
                                                            ? 'bg-green-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    Cash
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatusForm(prev => ({ ...prev, payment_type: 'ONLINE' }))}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                        paymentStatusForm.payment_type === 'ONLINE'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    Online
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentStatusForm(prev => ({ ...prev, payment_type: 'OTHER' }))}
                                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                        paymentStatusForm.payment_type === 'OTHER'
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    Other
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 sm:mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPaymentStatusModal(false)}
                                            disabled={updatingPaymentStatus}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUpdatePaymentStatus}
                                            disabled={updatingPaymentStatus}
                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {updatingPaymentStatus ? 'Updating...' : 'Update Payment Status'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </AdminLayout>
    );
}

