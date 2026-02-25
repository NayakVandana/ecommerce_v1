import { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useOrderStore } from './useOrderStore';
import { useDeliveryBoyStore } from './useDeliveryBoyStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import AlertModal from '../../../Components/AlertModal';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import CancellationReasonModal from '../../../Components/CancellationReasonModal';
import { 
    EyeIcon, 
    MagnifyingGlassIcon, 
    EllipsisVerticalIcon,
    ShoppingBagIcon,
    ClipboardDocumentListIcon,
    TruckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    FaceSmileIcon,
    ExclamationTriangleIcon,
    StarIcon,
    UserIcon,
    XMarkIcon,
    PencilIcon
} from '@heroicons/react/24/outline';

export default function OrderIndex() {
    const { props } = usePage();
    const section = (props as any).section || 'all';
    
    // Normalize section value
    const normalizedSection = section === '' || !section ? 'all' : section;
    
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderCounts, setOrderCounts] = useState<any>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [showDeliveryBoyModal, setShowDeliveryBoyModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
    const [loadingDeliveryBoys, setLoadingDeliveryBoys] = useState(false);
    const [selectedDeliveryBoyId, setSelectedDeliveryBoyId] = useState<number | null>(null);
    const [assigningDeliveryBoy, setAssigningDeliveryBoy] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ orderId: number; newStatus: string; actionType: string } | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [pendingCancelOrderId, setPendingCancelOrderId] = useState<number | null>(null);
    const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);
    const [editingPaymentOrder, setEditingPaymentOrder] = useState<any>(null);
    const [paymentStatusForm, setPaymentStatusForm] = useState({
        payment_method: 'CASH_ON_DELIVERY',
        payment_type: 'CASH',
    });
    const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [processingReturn, setProcessingReturn] = useState<number | null>(null);
    const [processingReplacement, setProcessingReplacement] = useState<number | null>(null);
    const [showDeliveryDateModal, setShowDeliveryDateModal] = useState(false);
    const [selectedOrderForDeliveryDate, setSelectedOrderForDeliveryDate] = useState<number | null>(null);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [updatingDeliveryDate, setUpdatingDeliveryDate] = useState(false);

    useEffect(() => {
        loadOrders();
        loadOrderCounts();
    }, [dateRange, normalizedSection]);

    useEffect(() => {
        if (showDeliveryBoyModal) {
            loadDeliveryBoys();
        }
    }, [showDeliveryBoyModal]);

    const loadOrderCounts = async () => {
        try {
            const response = await useOrderStore.getCounts();
            if (response.data?.status && response.data?.data) {
                setOrderCounts(response.data.data);
            }
        } catch (error) {
            console.error('Error loading order counts:', error);
        }
    };

    const loadOrders = async () => {
        try {
            setLoading(true);
            const requestData: any = {
                section: normalizedSection
            };
            
            if (searchTerm) {
                requestData.search = searchTerm;
            }
            
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

    const handleSearch = () => {
        loadOrders();
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const handleAcceptOrder = (orderId: number) => {
        setPendingStatusUpdate({
            orderId,
            newStatus: 'processing',
            actionType: 'accept'
        });
        setShowConfirmModal(true);
    };

    const handleRejectOrder = (orderId: number) => {
        setPendingCancelOrderId(orderId);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async (cancelData: { cancellation_reason: string; cancellation_notes: string | null }) => {
        if (!pendingCancelOrderId) return;

        try {
            setCancelling(true);
            await useOrderStore.cancel({
                id: pendingCancelOrderId,
                cancellation_reason: cancelData.cancellation_reason,
                cancellation_notes: cancelData.cancellation_notes,
            });
            loadOrders();
            loadOrderCounts();
            setShowCancelModal(false);
            setPendingCancelOrderId(null);
            setAlertMessage('Order cancelled successfully');
            setAlertType('success');
            setShowAlert(true);
        } catch (error) {
            console.error('Error cancelling order:', error);
            setAlertMessage('Failed to cancel order');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setCancelling(false);
        }
    };

    const handleApproveReturn = async (orderId: number) => {
        try {
            setProcessingReturn(orderId);
            const response = await useOrderStore.approveReturn({ id: orderId });
            if (response.data?.status) {
                loadOrders();
                loadOrderCounts();
                setAlertMessage('Return approved and refund processed successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to approve return');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error approving return:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to approve return');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setProcessingReturn(null);
        }
    };

    const handleRejectReturn = async (orderId: number) => {
        const rejectionReason = prompt('Please enter rejection reason (optional):');
        try {
            setProcessingReturn(orderId);
            const response = await useOrderStore.rejectReturn({ 
                id: orderId,
                rejection_reason: rejectionReason || null
            });
            if (response.data?.status) {
                loadOrders();
                loadOrderCounts();
                setAlertMessage('Return request rejected');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to reject return');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error rejecting return:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to reject return');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setProcessingReturn(null);
        }
    };

    const handleProcessRefund = async (orderId: number) => {
        try {
            setProcessingReturn(orderId);
            const response = await useOrderStore.processRefund({ id: orderId });
            if (response.data?.status) {
                loadOrders();
                loadOrderCounts();
                setAlertMessage('Refund processed successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to process refund');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error processing refund:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to process refund');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setProcessingReturn(null);
        }
    };

    const handleApproveReplacement = async (orderId: number) => {
        try {
            setProcessingReplacement(orderId);
            const response = await useOrderStore.approveReplacement({ id: orderId });
            if (response.data?.status) {
                loadOrders();
                loadOrderCounts();
                setAlertMessage('Replacement approved and new order created successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to approve replacement');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error approving replacement:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to approve replacement');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setProcessingReplacement(null);
        }
    };

    const handleRejectReplacement = async (orderId: number) => {
        const rejectionReason = prompt('Please enter rejection reason (optional):');
        try {
            setProcessingReplacement(orderId);
            const response = await useOrderStore.rejectReplacement({ 
                id: orderId,
                rejection_reason: rejectionReason || null
            });
            if (response.data?.status) {
                loadOrders();
                loadOrderCounts();
                setAlertMessage('Replacement request rejected');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to reject replacement');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error rejecting replacement:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to reject replacement');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setProcessingReplacement(null);
        }
    };

    const handleProcessReplacement = async (orderId: number) => {
        try {
            setProcessingReplacement(orderId);
            const response = await useOrderStore.processReplacement({ id: orderId });
            if (response.data?.status) {
                loadOrders();
                loadOrderCounts();
                setAlertMessage('Replacement processed successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to process replacement');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error processing replacement:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to process replacement');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setProcessingReplacement(null);
        }
    };

    const handleEditPaymentStatus = (order: any) => {
        setEditingPaymentOrder(order);
        setPaymentStatusForm({
            payment_method: order.payment_method || 'CASH_ON_DELIVERY',
            payment_type: order.payment_type || 'CASH',
        });
        setShowPaymentStatusModal(true);
    };

    const handleUpdatePaymentStatus = async () => {
        if (!editingPaymentOrder) return;
        
        try {
            setUpdatingPaymentStatus(true);
            const response = await useOrderStore.updatePaymentStatus({
                id: editingPaymentOrder.id,
                payment_method: paymentStatusForm.payment_method,
                payment_type: paymentStatusForm.payment_type,
            });
            
            if (response.data?.status) {
                loadOrders();
                setShowPaymentStatusModal(false);
                setEditingPaymentOrder(null);
                setAlertMessage('Payment status updated successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to update payment status');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error updating payment status:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to update payment status');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setUpdatingPaymentStatus(false);
        }
    };

    const handleEditDeliveryDate = (orderId: number, currentDeliveryDate?: string) => {
        setSelectedOrderForDeliveryDate(orderId);
        if (currentDeliveryDate) {
            const date = new Date(currentDeliveryDate);
            setDeliveryDate(date.toISOString().split('T')[0]);
        } else {
            // Default to tomorrow
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 1);
            setDeliveryDate(defaultDate.toISOString().split('T')[0]);
        }
        setShowDeliveryDateModal(true);
    };

    const handleUpdateDeliveryDate = async () => {
        if (!selectedOrderForDeliveryDate || !deliveryDate) {
            setAlertMessage('Please select a delivery date');
            setAlertType('error');
            setShowAlert(true);
            return;
        }

        const selectedDate = new Date(deliveryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setAlertMessage('Delivery date cannot be in the past');
            setAlertType('error');
            setShowAlert(true);
            return;
        }

        try {
            setUpdatingDeliveryDate(true);
            const response = await useOrderStore.updateDeliveryDate({
                id: selectedOrderForDeliveryDate,
                delivery_date: deliveryDate,
            });
            if (response.data?.status) {
                loadOrders();
                setShowDeliveryDateModal(false);
                setSelectedOrderForDeliveryDate(null);
                setAlertMessage('Delivery date updated successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to update delivery date');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error updating delivery date:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to update delivery date');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setUpdatingDeliveryDate(false);
        }
    };

    const handleStatusUpdate = (orderId: number, newStatus: string, actionType: string = 'update') => {
        setPendingStatusUpdate({
            orderId,
            newStatus,
            actionType
        });
        setShowConfirmModal(true);
    };

    const confirmStatusUpdate = async () => {
        if (!pendingStatusUpdate) return;

        try {
            // Reject is now handled by cancellation modal, so this shouldn't happen
            if (pendingStatusUpdate.actionType === 'reject') {
                setShowConfirmModal(false);
                setPendingStatusUpdate(null);
                setPendingCancelOrderId(pendingStatusUpdate.orderId);
                setShowCancelModal(true);
                return;
            } else {
                await useOrderStore.updateStatus({
                    id: pendingStatusUpdate.orderId,
                    status: pendingStatusUpdate.newStatus
                });
            }
            loadOrders();
            loadOrderCounts();
            setShowConfirmModal(false);
            setPendingStatusUpdate(null);
        } catch (error) {
            console.error('Error updating order status:', error);
            setAlertMessage('Failed to update order status');
            setAlertType('error');
            setShowAlert(true);
            setShowConfirmModal(false);
            setPendingStatusUpdate(null);
        }
    };

    const getStatusUpdateMessage = () => {
        if (!pendingStatusUpdate) return '';
        
        const statusLabels: any = {
            'processing': 'Accept',
            'cancelled': 'Reject',
            'shipped': 'Mark as Shipped',
            'completed': 'Mark as Completed',
            'delivered': 'Mark as Delivered',
            'pending': 'Retry',
        };

        const actionLabel = statusLabels[pendingStatusUpdate.newStatus] || 'Update';
        return `Are you sure you want to ${actionLabel.toLowerCase()} this order? This action will change the order status to "${pendingStatusUpdate.newStatus}".`;
    };

    const loadDeliveryBoys = async () => {
        try {
            setLoadingDeliveryBoys(true);
            const response = await useDeliveryBoyStore.getDeliveryBoys();
            if (response.data?.status) {
                setDeliveryBoys(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading delivery boys:', error);
            setAlertMessage('Failed to load delivery boys');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setLoadingDeliveryBoys(false);
        }
    };

    const handleAssignDeliveryBoyClick = (orderId: number) => {
        setSelectedOrderId(orderId);
        setSelectedDeliveryBoyId(null);
        setShowDeliveryBoyModal(true);
    };

    const handleAssignDeliveryBoy = async () => {
        if (!selectedDeliveryBoyId || !selectedOrderId) {
            setAlertMessage('Please select a delivery boy');
            setAlertType('warning');
            setShowAlert(true);
            return;
        }

        try {
            setAssigningDeliveryBoy(true);
            const response = await useDeliveryBoyStore.assignDeliveryBoy({
                id: selectedOrderId,
                delivery_boy_id: selectedDeliveryBoyId,
            });

            if (response.data?.status) {
                await loadOrders();
                await loadOrderCounts();
                setShowDeliveryBoyModal(false);
                setSelectedOrderId(null);
                setSelectedDeliveryBoyId(null);
                setAlertMessage('Delivery boy assigned successfully. Delivery boy can generate OTP from their dashboard.');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to assign delivery boy');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error assigning delivery boy:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to assign delivery boy');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setAssigningDeliveryBoy(false);
        }
    };

    const getSectionTitle = () => {
        switch (normalizedSection) {
            case 'pending':
                return 'Pending Orders';
            case 'ready-for-shipping':
                return 'Ready For Shipping';
            case 'shipped':
                return 'Shipped Orders';
            case 'out-for-delivery':
                return 'Out for Delivery';
            case 'delivered':
                return 'Delivered Orders';
            case 'failed-delivery':
                return 'Failed Delivery';
            case 'picked-up':
                return 'Picked Up';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled Orders';
            case 'return-refund':
                return 'Return & Refund';
            case 'replacement':
                return 'Replacement Orders';
            case 'processed':
                return 'Processed Orders';
            case 'direct-orders':
                return 'Direct Orders';
            case 'all':
            default:
                return 'All Orders';
        }
    };

    const orderStatusCards = [
        { 
            id: 'all', 
            label: 'All Orders', 
            icon: ShoppingBagIcon, 
            href: '/admin/orders/all',
            bgColor: 'bg-indigo-500',
            hoverBgColor: 'hover:bg-indigo-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'pending', 
            label: 'Pending Orders', 
            icon: ClipboardDocumentListIcon, 
            href: '/admin/orders/pending',
            bgColor: 'bg-yellow-500',
            hoverBgColor: 'hover:bg-yellow-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'ready-for-shipping', 
            label: 'Ready for shipping', 
            icon: TruckIcon, 
            href: '/admin/orders/ready-for-shipping',
            bgColor: 'bg-blue-500',
            hoverBgColor: 'hover:bg-blue-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'shipped', 
            label: 'Shipped Orders', 
            icon: TruckIcon, 
            href: '/admin/orders/shipped',
            bgColor: 'bg-purple-500',
            hoverBgColor: 'hover:bg-purple-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'out-for-delivery', 
            label: 'Out for Delivery', 
            icon: TruckIcon, 
            href: '/admin/orders/out-for-delivery',
            bgColor: 'bg-indigo-500',
            hoverBgColor: 'hover:bg-indigo-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'return-refund', 
            label: 'Return & Refund', 
            icon: ArrowPathIcon, 
            href: '/admin/orders/return-refund',
            bgColor: 'bg-orange-500',
            hoverBgColor: 'hover:bg-orange-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'replacement', 
            label: 'Replacement', 
            icon: ArrowPathIcon, 
            href: '/admin/orders/replacement',
            bgColor: 'bg-blue-500',
            hoverBgColor: 'hover:bg-blue-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'delivered', 
            label: 'Delivered Orders', 
            icon: FaceSmileIcon, 
            href: '/admin/orders/delivered',
            bgColor: 'bg-green-500',
            hoverBgColor: 'hover:bg-green-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'failed-delivery', 
            label: 'Failed Delivery', 
            icon: ExclamationTriangleIcon, 
            href: '/admin/orders/failed-delivery',
            bgColor: 'bg-red-500',
            hoverBgColor: 'hover:bg-red-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'picked-up', 
            label: 'Picked Up', 
            icon: ShoppingBagIcon, 
            href: '/admin/orders/picked-up',
            bgColor: 'bg-emerald-500',
            hoverBgColor: 'hover:bg-emerald-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'completed', 
            label: 'Completed', 
            icon: StarIcon, 
            href: '/admin/orders/completed',
            bgColor: 'bg-teal-500',
            hoverBgColor: 'hover:bg-teal-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'cancelled', 
            label: 'Cancelled Orders', 
            icon: XCircleIcon, 
            href: '/admin/orders/cancelled',
            bgColor: 'bg-gray-500',
            hoverBgColor: 'hover:bg-gray-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'processed', 
            label: 'Processed Orders', 
            icon: CheckCircleIcon, 
            href: '/admin/orders/processed',
            bgColor: 'bg-cyan-500',
            hoverBgColor: 'hover:bg-cyan-600',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
        { 
            id: 'direct-orders', 
            label: 'Direct Orders', 
            icon: ShoppingBagIcon, 
            href: '/admin/orders/direct-orders',
            bgColor: 'bg-green-600',
            hoverBgColor: 'hover:bg-green-700',
            textColor: 'text-white',
            iconColor: 'text-white'
        },
    ];

    const getDeliveryStatusBadge = (status: string) => {
        const statusColors: any = {
            pending: 'text-orange-600',
            processing: 'text-blue-600',
            shipped: 'text-purple-600',
            completed: 'text-green-600',
            cancelled: 'text-red-600',
            failed: 'text-red-600',
            'failed-delivery': 'text-red-600',
            delivered: 'text-green-600',
        };

        // Format status display
        const statusDisplay = status
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return (
            <span className={`text-sm font-medium ${
                statusColors[status] || 'text-gray-600'
            }`}>
                {statusDisplay}
            </span>
        );
    };

    // Helper function to get payment method display label
    const getPaymentMethodLabel = (value: string) => {
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
        return labels[value] || value;
    };

    // Helper function to get payment type display label
    const getPaymentTypeLabel = (value: string) => {
        const labels: any = {
            'CASH': 'Cash',
            'ONLINE': 'Online',
            'OTHER': 'Other',
        };
        return labels[value] || value;
    };

    const getPaymentStatusBadge = (order: any) => {
        const paymentMethod = order.payment_method || 'CASH_ON_DELIVERY';
        const paymentType = order.payment_type || 'CASH';
        
        const typeColors: any = {
            'CASH': 'bg-green-100 text-green-800',
            'ONLINE': 'bg-blue-100 text-blue-800',
            'OTHER': 'bg-purple-100 text-purple-800',
        };
        
        return (
            <div className="flex flex-col gap-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[paymentType] || 'bg-gray-100 text-gray-800'}`}>
                    {getPaymentTypeLabel(paymentType)}
                </span>
                <span className="text-xs text-gray-600">
                    {getPaymentMethodLabel(paymentMethod)}
                </span>
            </div>
        );
    };

    const isToday = (dateString: string | null | undefined): boolean => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const shouldHighlightOrder = (order: any): boolean => {
        const status = order.status;
        const isPendingOrReadyForShipping = status === 'pending' || status === 'processing';
        const isDeliveryDateToday = isToday(order.delivery_date);
        return isPendingOrReadyForShipping && isDeliveryDateToday;
    };

    const currentPath = `/admin/orders${normalizedSection !== 'all' ? `/${normalizedSection}` : '/all'}`;

    return (
        <AdminLayout currentPath={currentPath}>
            <div className="space-y-6">
                {/* Title */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage your Orders</h1>
                </div>

                {/* Order Status Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                    {orderStatusCards.map((card) => {
                        const Icon = card.icon;
                        const isActive = normalizedSection === card.id || (card.id === 'all' && normalizedSection === 'all');
                        const count = orderCounts[card.id] || 0;
                        return (
                            <Link
                                key={card.id}
                                href={card.href}
                                className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${card.bgColor} ${card.hoverBgColor} ${
                                    isActive ? 'ring-4 ring-offset-2 ring-white' : ''
                                }`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`mb-2 ${card.iconColor}`}>
                                        <Icon className="h-8 w-8" />
                                    </div>
                                    <span className={`text-sm font-semibold ${card.textColor} mb-1`}>
                                        {card.label}
                                    </span>
                                    <span className={`text-2xl font-bold ${card.textColor}`}>
                                        {count}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div>
                    
                    {/* Search and Filters */}
                    <div className="bg-white shadow rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Search Bar */}
                            <div className="flex-1 w-full sm:min-w-[200px]">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search"
                                        className="block w-full pl-9 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <span className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800">Search</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Date Filters */}
                            <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[280px]">
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
                </div>

                <div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64 bg-white shadow rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                            Order ID
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                            Products
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                            Customer
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                            Amount
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                            Status
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                                            Payment
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                                            Delivery Boy
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                                            Date
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">
                                            Delivery Date
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.length > 0 ? (
                                        orders.map((order: any) => {
                                            const shouldHighlight = shouldHighlightOrder(order);
                                            return (
                                            <tr 
                                                key={order.id} 
                                                className={shouldHighlight ? "bg-red-100 hover:bg-red-200" : "hover:bg-gray-50"}
                                            >
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                                        <Link
                                                            href={`/admin/orders/${order.id}?section=${normalizedSection}`}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline"
                                                        >
                                                            {order.order_number || `#${order.id}`} 
                                                            {order.is_direct_order && (
                                                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-1">
                                                                Direct
                                                            </span>
                                                        )}
                                                        </Link>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                    {order.items?.length || 0}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 max-w-[120px] sm:max-w-none truncate">
                                                    {order.user?.id ? (
                                                        <Link
                                                            href={`/admin/users/${order.user.id}?from=orders&section=${normalizedSection}`}
                                                            className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline"
                                                        >
                                                            {order.name || order.user?.name || 'Guest'}
                                                        </Link>
                                                    ) : (
                                                            <span>{order.name || 'Guest'}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                    ₹{Number(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                    {getDeliveryStatusBadge(order.status)}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentStatusBadge(order)}
                                                        <button
                                                            onClick={() => handleEditPaymentStatus(order)}
                                                            className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                                            title="Edit Payment Status"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                                                    {order.delivery_boy ? (
                                                        <div>
                                                            <p className="font-medium">{order.delivery_boy.name}</p>
                                                            {order.delivery_boy.phone && (
                                                                <p className="text-xs text-gray-500">{order.delivery_boy.phone}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Not assigned</span>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                                                    {new Date(order.created_at).toISOString().split('T')[0]}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden xl:table-cell">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                                                        {order.delivery_date ? (
                                                            <span className="text-xs sm:text-sm font-medium text-indigo-600">
                                                                {new Date(order.delivery_date).toLocaleDateString('en-US', { 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Not set</span>
                                                        )}
                                                        {order.status !== 'shipped' && (
                                                            <button
                                                                onClick={() => handleEditDeliveryDate(order.id, order.delivery_date)}
                                                                className="px-2 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 flex items-center gap-1"
                                                                title="Set Delivery Date"
                                                            >
                                                                <TruckIcon className="h-3 w-3" />
                                                                <span className="hidden sm:inline">{order.delivery_date ? 'Change' : 'Set'}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                                    <div className="flex items-center gap-1 sm:gap-2">
                                                        <Link
                                                            href={`/admin/orders/${order.id}?section=${normalizedSection}`}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="View Details"
                                                        >
                                                            <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </Link>
                                                        
                                                        {/* Assign Delivery Boy - Show once for orders that need delivery boy */}
                                                        {!order.delivery_boy_id && 
                                                         (order.status === 'processing' || order.status === 'shipped' || order.status === 'out_for_delivery') && (
                                                            <button
                                                                onClick={() => handleAssignDeliveryBoyClick(order.id)}
                                                                className="px-2 sm:px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                                                                title="Assign Delivery Boy"
                                                            >
                                                                <UserIcon className="h-3 w-3" />
                                                                <span className="hidden sm:inline">Assign Delivery</span>
                                                                <span className="sm:hidden">Assign</span>
                                                            </button>
                                                        )}

                                                        {/* Pending Orders Actions */}
                                                        {normalizedSection === 'pending' && order.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptOrder(order.id)}
                                                                    className="px-2 sm:px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                    title="Accept Order"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectOrder(order.id)}
                                                                    className="px-2 sm:px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                                                    title="Reject Order"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Ready for Shipping Actions */}
                                                        {normalizedSection === 'ready-for-shipping' && order.status === 'processing' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'shipped', 'ship')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                                                title="Mark as Shipped"
                                                            >
                                                                Mark as Shipped
                                                            </button>
                                                        )}
                                                        
                                                        {/* Shipped Orders Actions */}
                                                        {normalizedSection === 'shipped' && order.status === 'shipped' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'completed', 'complete')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                title="Mark as Delivered"
                                                            >
                                                                Mark as Delivered
                                                            </button>
                                                        )}
                                                        
                                                        {/* Out for Delivery Actions */}
                                                        {normalizedSection === 'out-for-delivery' && order.status === 'out_for_delivery' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'delivered', 'deliver')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                title="Mark as Delivered"
                                                            >
                                                                Mark as Delivered
                                                            </button>
                                                        )}
                                                        
                                                        {/* Direct Order - Mark as Delivered (available for multiple statuses) */}
                                                        {order.is_direct_order && 
                                                         order.status !== 'delivered' && 
                                                         order.status !== 'completed' && 
                                                         order.status !== 'cancelled' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'delivered', 'deliver')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 flex items-center gap-1"
                                                                title="Mark Direct Order as Delivered"
                                                            >
                                                                <CheckCircleIcon className="h-3 w-3" />
                                                                Mark as Delivered
                                                            </button>
                                                        )}
                                                        
                                                        {/* Failed Delivery Actions - Can retry or cancel */}
                                                        {normalizedSection === 'failed-delivery' && order.status === 'cancelled' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'pending', 'retry')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                                                title="Retry Order"
                                                            >
                                                                Retry Order
                                                            </button>
                                                        )}
                                                        
                                                        {/* Return & Refund Actions */}
                                                        {normalizedSection === 'return-refund' && order.return_status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApproveReturn(order.id)}
                                                                    disabled={processingReturn === order.id}
                                                                    className={`px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 ${processingReturn === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    title="Approve Return"
                                                                >
                                                                    {processingReturn === order.id ? 'Processing...' : 'Approve Return'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectReturn(order.id)}
                                                                    disabled={processingReturn === order.id}
                                                                    className={`px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 ${processingReturn === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    title="Reject Return"
                                                                >
                                                                    {processingReturn === order.id ? 'Processing...' : 'Reject Return'}
                                                                </button>
                                                            </>
                                                        )}
                                                        {normalizedSection === 'return-refund' && order.return_status === 'approved' && (
                                                            <button
                                                                onClick={() => handleProcessRefund(order.id)}
                                                                disabled={processingReturn === order.id}
                                                                className={`px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 ${processingReturn === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                title="Process Refund"
                                                            >
                                                                {processingReturn === order.id ? 'Processing...' : 'Process Refund'}
                                                            </button>
                                                        )}

                                                        {/* Replacement Actions */}
                                                        {normalizedSection === 'replacement' && order.replacement_status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApproveReplacement(order.id)}
                                                                    disabled={processingReplacement === order.id}
                                                                    className={`px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 ${processingReplacement === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    title="Approve Replacement"
                                                                >
                                                                    {processingReplacement === order.id ? 'Processing...' : 'Approve Replacement'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectReplacement(order.id)}
                                                                    disabled={processingReplacement === order.id}
                                                                    className={`px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 ${processingReplacement === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    title="Reject Replacement"
                                                                >
                                                                    {processingReplacement === order.id ? 'Processing...' : 'Reject Replacement'}
                                                                </button>
                                                            </>
                                                        )}
                                                        {normalizedSection === 'replacement' && order.replacement_status === 'approved' && (
                                                            <button
                                                                onClick={() => handleProcessReplacement(order.id)}
                                                                disabled={processingReplacement === order.id}
                                                                className={`px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 ${processingReplacement === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                title="Process Replacement"
                                                            >
                                                                {processingReplacement === order.id ? 'Processing...' : 'Process Replacement'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                message={alertMessage}
                type={alertType}
            />

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setPendingStatusUpdate(null);
                }}
                onConfirm={confirmStatusUpdate}
                title="Confirm Status Update"
                message={getStatusUpdateMessage()}
                confirmText="Confirm"
                cancelText="Cancel"
                confirmButtonColor={pendingStatusUpdate?.actionType === 'reject' ? 'red' : 'indigo'}
            />

            <CancellationReasonModal
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setPendingCancelOrderId(null);
                }}
                onConfirm={handleCancelConfirm}
                loading={cancelling}
            />

            {/* Delivery Boy Assignment Modal */}
            {showDeliveryBoyModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => {
                                setShowDeliveryBoyModal(false);
                                setSelectedOrderId(null);
                                setSelectedDeliveryBoyId(null);
                            }}
                        ></div>

                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Assign Delivery Boy</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeliveryBoyModal(false);
                                            setSelectedOrderId(null);
                                            setSelectedDeliveryBoyId(null);
                                        }}
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
                                                    setSelectedOrderId(null);
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

            {/* Payment Status Edit Modal */}
            {showPaymentStatusModal && editingPaymentOrder && (
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
                                        Order: <span className="font-medium">{editingPaymentOrder.order_number || `#${editingPaymentOrder.id}`}</span>
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

            {/* Delivery Date Modal */}
            {showDeliveryDateModal && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => {
                                setShowDeliveryDateModal(false);
                                setSelectedOrderForDeliveryDate(null);
                            }}
                        ></div>

                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Set Delivery Date</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDeliveryDateModal(false);
                                            setSelectedOrderForDeliveryDate(null);
                                        }}
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
                                        onClick={() => {
                                            setShowDeliveryDateModal(false);
                                            setSelectedOrderForDeliveryDate(null);
                                        }}
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

            {/* Payment Status Edit Modal */}
            {showPaymentStatusModal && editingPaymentOrder && (
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
                                        Order: <span className="font-medium">{editingPaymentOrder.order_number || `#${editingPaymentOrder.id}`}</span>
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

