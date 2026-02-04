import { useEffect, useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { useOrderStore } from './useOrderStore';
import AdminLayout from '../Layout';
import { 
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    TruckIcon,
    ArrowPathIcon
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
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

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

    const handleStatusUpdate = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to update order status to "${newStatus}"?`)) {
            return;
        }

        try {
            setUpdatingStatus(true);
            const response = await useOrderStore.updateStatus({
                id: orderId,
                status: newStatus,
            });
            
            if (response.data?.status) {
                await fetchOrder();
                alert('Order status updated successfully');
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            alert(error.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingStatus(false);
        }
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

        return actions;
    };

    const handleQuickAction = async (newStatus: string) => {
        await handleStatusUpdate(newStatus);
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
                            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Order #{order.order_number || order.id}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(order.status)}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Order Date</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Date(order.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Status</p>
                                    <div className="mt-1">
                                        {getStatusBadge(order.status)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="text-sm font-medium text-gray-900">{order.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{order.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{order.phone}</p>
                                </div>
                                {order.user && (
                                    <div>
                                        <p className="text-xs text-gray-500">User Account</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.user.name} ({order.user.email})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                            <div className="text-sm text-gray-900">
                                <p>{order.address}</p>
                                <p>{order.city}, {order.postal_code}</p>
                                <p>{order.country}</p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                            <div className="space-y-4">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    
                                    return (
                                        <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                                            <div className="flex-shrink-0">
                                                <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden">
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
                                            
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">
                                                    {item.product_name || product?.product_name}
                                                </h3>
                                                {item.product_sku && (
                                                    <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                                                )}
                                                {(item.size || item.color) && (
                                                    <p className="text-xs text-gray-500">
                                                        {item.size && `Size: ${item.size} `}
                                                        {item.color && `Color: ${item.color}`}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Quantity: {item.quantity} × ${Number(item.price || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-indigo-600">
                                                    ${Number(item.subtotal || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

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
                                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && order.coupon_code && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Discount ({order.coupon_code.code})</span>
                                        <span className="text-green-600">-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="text-gray-900">${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-gray-900">${shipping.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-900">Total</span>
                                    <span className="font-bold text-lg text-indigo-600">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

