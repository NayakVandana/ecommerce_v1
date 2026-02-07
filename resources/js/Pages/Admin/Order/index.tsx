import { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useOrderStore } from './useOrderStore';
import { useDeliveryBoyStore } from './useDeliveryBoyStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import AlertModal from '../../../Components/AlertModal';
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
    XMarkIcon
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

    const handleAcceptOrder = async (orderId: number) => {
        try {
            await useOrderStore.updateStatus({
                id: orderId,
                status: 'processing'
            });
            loadOrders();
            loadOrderCounts();
        } catch (error) {
            console.error('Error accepting order:', error);
        }
    };

    const handleRejectOrder = async (orderId: number) => {
        try {
            await useOrderStore.cancel({ id: orderId });
            loadOrders();
            loadOrderCounts();
        } catch (error) {
            console.error('Error rejecting order:', error);
        }
    };

    const handleStatusUpdate = async (orderId: number, newStatus: string) => {
        try {
            await useOrderStore.updateStatus({
                id: orderId,
                status: newStatus
            });
            loadOrders();
            loadOrderCounts();
        } catch (error) {
            console.error('Error updating order status:', error);
        }
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
                setAlertMessage('Delivery boy assigned successfully. OTP has been generated.');
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
            case 'processed':
                return 'Processed Orders';
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

    const getPaymentStatusBadge = (paymentStatus: string) => {
        return (
            <span className="text-sm text-gray-700">
                {paymentStatus || 'ONLINE'}
            </span>
        );
    };

    const currentPath = `/admin/orders${normalizedSection !== 'all' ? `/${normalizedSection}` : '/all'}`;

    return (
        <AdminLayout currentPath={currentPath}>
            <div className="space-y-6">
                {/* Title */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manage your Orders</h1>
                </div>

                {/* Order Status Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                    <div className="bg-white shadow rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Bar */}
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <span className="text-sm text-indigo-600 hover:text-indigo-800">Search</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Date Filters */}
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
                </div>

                <div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64 bg-white shadow rounded-lg">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            No of Products
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Customer Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Delivery Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Payment Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Delivery Boy
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.length > 0 ? (
                                        orders.map((order: any) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {order.order_number || `#${order.id}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {order.items?.length || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {Number(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getDeliveryStatusBadge(order.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getPaymentStatusBadge('ONLINE')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(order.created_at).toISOString().split('T')[0]}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/orders/${order.id}?section=${normalizedSection}`}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="View Details"
                                                        >
                                                            <EyeIcon className="h-5 w-5" />
                                                        </Link>
                                                        {/* All Orders - Assign Delivery Boy for processing/shipped orders */}
                                                        {(normalizedSection === 'all' || normalizedSection === 'ready-for-shipping' || normalizedSection === 'shipped') && 
                                                         (order.status === 'processing' || order.status === 'shipped') && 
                                                         !order.delivery_boy_id && (
                                                            <button
                                                                onClick={() => handleAssignDeliveryBoyClick(order.id)}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                                                                title="Assign Delivery Boy"
                                                            >
                                                                <UserIcon className="h-3 w-3" />
                                                                Assign Delivery
                                                            </button>
                                                        )}

                                                        {/* Pending Orders Actions */}
                                                        {normalizedSection === 'pending' && order.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptOrder(order.id)}
                                                                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                    title="Accept Order"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectOrder(order.id)}
                                                                    className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                                                    title="Reject Order"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Ready for Shipping Actions */}
                                                        {normalizedSection === 'ready-for-shipping' && order.status === 'processing' && (
                                                            <>
                                                                {!order.delivery_boy_id && (
                                                                    <button
                                                                        onClick={() => handleAssignDeliveryBoyClick(order.id)}
                                                                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                                                                        title="Assign Delivery Boy"
                                                                    >
                                                                        <UserIcon className="h-3 w-3" />
                                                                        Assign Delivery
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleStatusUpdate(order.id, 'shipped')}
                                                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                                                    title="Mark as Shipped"
                                                                >
                                                                    Mark as Shipped
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Shipped Orders Actions */}
                                                        {normalizedSection === 'shipped' && order.status === 'shipped' && (
                                                            <>
                                                                {!order.delivery_boy_id && (
                                                                    <button
                                                                        onClick={() => handleAssignDeliveryBoyClick(order.id)}
                                                                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                                                                        title="Assign Delivery Boy"
                                                                    >
                                                                        <UserIcon className="h-3 w-3" />
                                                                        Assign Delivery
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                    title="Mark as Delivered"
                                                                >
                                                                    Mark as Delivered
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Out for Delivery Actions */}
                                                        {normalizedSection === 'out-for-delivery' && order.status === 'out_for_delivery' && (
                                                            <>
                                                                {!order.delivery_boy_id && (
                                                                    <button
                                                                        onClick={() => handleAssignDeliveryBoyClick(order.id)}
                                                                        className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center gap-1"
                                                                        title="Assign Delivery Boy"
                                                                    >
                                                                        <UserIcon className="h-3 w-3" />
                                                                        Assign Delivery
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                                                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                    title="Mark as Delivered"
                                                                >
                                                                    Mark as Delivered
                                                                </button>
                                                            </>
                                                        )}
                                                        
                                                        {/* Failed Delivery Actions - Can retry or cancel */}
                                                        {normalizedSection === 'failed-delivery' && order.status === 'cancelled' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'pending')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                                                title="Retry Order"
                                                            >
                                                                Retry Order
                                                            </button>
                                                        )}
                                                        
                                                        {/* Return & Refund Actions */}
                                                        {normalizedSection === 'return-refund' && order.status === 'cancelled' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                                                title="Process Refund"
                                                            >
                                                                Process Refund
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
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
        </AdminLayout>
    );
}

