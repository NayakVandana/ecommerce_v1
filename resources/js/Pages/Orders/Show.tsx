import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useOrderStore } from './useOrderStore';
import Button from '../../Components/Button';

export default function Show() {
    const { props } = usePage();
    const orderId = (props as any).id;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetchOrder();
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

    const handleCancel = async () => {
        setShowConfirm(true);
        setConfirmAction(() => () => handleCancelConfirm());
    };

    const handleCancelConfirm = async () => {
        setShowConfirm(false);
        try {
            setCancelling(true);
            const response = await useOrderStore.cancel({ id: orderId });
            if (response.data?.status) {
                await fetchOrder();
                setAlertMessage('Order cancelled successfully');
                setAlertType('success');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to cancel order');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setCancelling(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors: any = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            out_for_delivery: 'bg-indigo-100 text-indigo-800',
            delivered: 'bg-green-100 text-green-800',
        };

        return (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                statusColors[status] || 'bg-gray-100 text-gray-800'
            }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading order...</p>
                </div>
            </AppLayout>
        );
    }

    if (!order) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">Order not found</p>
                        <Link
                            href="/orders"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const items = order.items || [];
    const subtotal = Number(order.subtotal || order.total || 0);
    const tax = Number(order.tax || 0);
    const shipping = Number(order.shipping || 0);
    const discount = Number(order.discount || 0);
    const total = Number(order.total || 0);

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href="/orders"
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                        ← Back to Orders
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Order Details</h1>
                            <p className="text-gray-600">
                                Order Number: <span className="font-semibold">{order.order_number || `#${order.id}`}</span>
                            </p>
                            <p className="text-gray-600">
                                Placed on: {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            {getStatusBadge(order.status)}
                        </div>
                    </div>

                    {order.status === 'pending' && (
                        <div className="mt-4">
                            <Button
                                variant="danger"
                                onClick={handleCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? 'Cancelling...' : 'Cancel Order'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">Order Items</h2>
                            
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
                                                            alt={product?.product_name || item.product_name} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400 text-xs flex items-center justify-center h-full">No Image</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">
                                                    {item.product_name || product?.product_name}
                                                </h3>
                                                {item.product_sku && (
                                                    <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                                                )}
                                                {(item.size || item.color) && (
                                                    <p className="text-sm text-gray-500">
                                                        {item.size && `Size: ${item.size} `}
                                                        {item.color && `Color: ${item.color}`}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Quantity: {item.quantity} × ${Number(item.price || 0).toFixed(2)}
                                                </p>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="font-bold text-indigo-600">
                                                    ${Number(item.subtotal || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                            
                            <div className="space-y-2">
                                <p><span className="font-semibold">Name:</span> {order.name}</p>
                                <p><span className="font-semibold">Email:</span> {order.email}</p>
                                <p><span className="font-semibold">Phone:</span> {order.phone}</p>
                                <p><span className="font-semibold">Address:</span> {order.address}</p>
                                <p><span className="font-semibold">City:</span> {order.city}</p>
                                <p><span className="font-semibold">Postal Code:</span> {order.postal_code}</p>
                                <p><span className="font-semibold">Country:</span> {order.country}</p>
                                <p><span className="font-semibold">Payment Method:</span> <span className="capitalize">Cash on Delivery</span></p>
                                
                                {/* Delivery Boy Information - Only show when order is NOT verified/delivered */}
                                {order.delivery_boy && !order.otp_verified && order.status !== 'delivered' && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-semibold text-gray-900 mb-2">Delivery Boy</p>
                                        <p className="text-sm text-gray-700">{order.delivery_boy.name}</p>
                                        {order.delivery_boy.phone && (
                                            <p className="text-sm text-gray-700">Phone: {order.delivery_boy.phone}</p>
                                        )}
                                    </div>
                                )}

                                {/* OTP Display - Only show when OTP is generated and NOT verified */}
                                {order.otp_code && !order.otp_verified && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-semibold text-gray-900 mb-2">Delivery OTP</p>
                                        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                                            <p className="text-xs text-gray-600 mb-1">Share this OTP with the delivery boy to complete delivery</p>
                                            <p className="text-2xl font-mono font-bold text-indigo-600 text-center">{order.otp_code}</p>
                                            <p className="text-xs text-gray-500 text-center mt-2">Pending verification</p>
                                        </div>
                                    </div>
                                )}
                                {order.notes && (
                                    <p className="mt-4">
                                        <span className="font-semibold">Notes:</span> {order.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && order.coupon_code && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({order.coupon_code.code})</span>
                                        <span>-${discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>${shipping.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4 mb-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

