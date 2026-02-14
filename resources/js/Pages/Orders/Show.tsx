import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useOrderStore } from './useOrderStore';
import Button from '../../Components/Button';
import CancellationReasonModal from '../../Components/CancellationReasonModal';
import ReturnReasonModal from '../../Components/ReturnReasonModal';
import ReplacementReasonModal from '../../Components/ReplacementReasonModal';
import toast from '../../utils/toast';
import { 
    CheckCircleIcon, 
    ArrowPathIcon, 
    TruckIcon, 
    XCircleIcon 
} from '@heroicons/react/24/outline';

export default function Show() {
    const { props } = usePage();
    const orderId = (props as any).id;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [requestingReturn, setRequestingReturn] = useState(false);
    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [requestingReplacement, setRequestingReplacement] = useState(false);

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

    const handleCancel = () => {
        setShowCancelModal(true);
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
                setShowCancelModal(false);
                await fetchOrder();
                toast({ type: 'success', message: 'Order cancelled successfully' });
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to cancel order' });
        } finally {
            setCancelling(false);
        }
    };

    const handleReturnRequest = () => {
        setShowReturnModal(true);
    };

    const handleReplacementRequest = () => {
        setShowReplacementModal(true);
    };

    const handleReplacementConfirm = async (replacementData: { replacement_reason: string; replacement_notes: string | null; item_ids?: number[] }) => {
        try {
            setRequestingReplacement(true);
            const response = await useOrderStore.requestReplacement({
                id: orderId,
                replacement_reason: replacementData.replacement_reason,
                replacement_notes: replacementData.replacement_notes,
                item_ids: replacementData.item_ids,
            });
            if (response.data?.status) {
                setShowReplacementModal(false);
                await fetchOrder();
                toast({ type: 'success', message: 'Replacement request submitted successfully' });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to submit replacement request' });
            }
        } catch (error: any) {
            console.error('Error requesting replacement:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to submit replacement request' });
        } finally {
            setRequestingReplacement(false);
        }
    };

    const handleReturnConfirm = async (returnData: { return_reason: string; return_notes: string | null; item_ids?: number[] }) => {
        try {
            setRequestingReturn(true);
            const response = await useOrderStore.requestReturn({
                id: orderId,
                return_reason: returnData.return_reason,
                return_notes: returnData.return_notes,
                item_ids: returnData.item_ids,
            });
            if (response.data?.status) {
                setShowReturnModal(false);
                await fetchOrder();
                toast({ type: 'success', message: 'Return request submitted successfully' });
            }
        } catch (error: any) {
            console.error('Error requesting return:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to submit return request' });
        } finally {
            setRequestingReturn(false);
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
                            {order.status === 'delivered' || order.otp_verified ? (
                                order.delivered_at && (
                                    <p className="text-gray-600 mt-1">
                                        Delivered on: <span className="font-semibold text-green-600">
                                            {new Date(order.delivered_at).toLocaleDateString('en-US', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })} at {new Date(order.delivered_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </p>
                                )
                            ) : order.delivery_date ? (
                                <p className="text-gray-600 mt-1">
                                    Expected Delivery: <span className="font-semibold text-indigo-600">
                                        {new Date(order.delivery_date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </span>
                                </p>
                            ) : null}
                            {order.status === 'cancelled' && order.cancellation_reason && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
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

                    {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') && 
                     !order.return_status && (
                        <div className="mt-4">
                            {/* Check if all products are returnable */}
                            {order.items && order.items.some((item: any) => !(item.is_returnable ?? false)) ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-yellow-900 mb-2">Return Not Available</p>
                                            <p className="text-xs text-yellow-800 mb-2">
                                                Some products in this order are not returnable:
                                            </p>
                                            <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                                                {order.items
                                                    .filter((item: any) => !(item.is_returnable ?? false))
                                                    .map((item: any, index: number) => (
                                                        <li key={index}>{item.product_name}</li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleReturnRequest}
                                    disabled={requestingReturn}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg shadow-md hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                    {requestingReturn ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Request Return/Refund</span>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {(order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') && 
                     !order.replacement_status && (
                        <div className="mt-4">
                            {/* Check if all products are replaceable */}
                            {order.items && order.items.some((item: any) => !(item.is_replaceable ?? false)) ? (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-yellow-900 mb-2">Replacement Not Available</p>
                                            <p className="text-xs text-yellow-800 mb-2">
                                                Some products in this order are not replaceable:
                                            </p>
                                            <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                                                {order.items
                                                    .filter((item: any) => !(item.is_replaceable ?? false))
                                                    .map((item: any, index: number) => (
                                                        <li key={index}>{item.product_name}</li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleReplacementRequest}
                                    disabled={requestingReplacement}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                    {requestingReplacement ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <span>Request Replacement</span>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {order.return_status && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                            <p className="text-sm font-semibold text-orange-900 mb-1">Return Status:</p>
                            <p className="text-sm text-orange-800 capitalize mb-2">
                                {order.return_status === 'pending' && '⏳ Return Request Pending'}
                                {order.return_status === 'approved' && '✅ Return Approved - Refund Processing'}
                                {order.return_status === 'rejected' && '❌ Return Request Rejected'}
                                {order.return_status === 'refunded' && '💰 Refund Processed'}
                            </p>
                            {order.return_reason && (
                                <p className="text-sm text-orange-700">
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
                                <p className="text-sm text-orange-700 mt-1 italic">"{order.return_notes}"</p>
                            )}
                            {order.refund_amount && (
                                <p className="text-sm font-semibold text-orange-900 mt-2">
                                    Refund Amount: ₹{Number(order.refund_amount).toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}

                    {order.replacement_status && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Replacement Status:</p>
                            <p className="text-sm text-blue-800 capitalize mb-2">
                                {order.replacement_status === 'pending' && '⏳ Replacement Request Pending'}
                                {order.replacement_status === 'approved' && '✅ Replacement Approved - New Order Created'}
                                {order.replacement_status === 'rejected' && '❌ Replacement Request Rejected'}
                                {order.replacement_status === 'processed' && '✅ Replacement Processed'}
                            </p>
                            {order.replacement_reason && (
                                <p className="text-sm text-blue-700">
                                    <span className="font-semibold">Reason:</span> 
                                    {order.replacement_reason === 'defective_item' && ' Defective Item'}
                                    {order.replacement_reason === 'wrong_item' && ' Wrong Item Received'}
                                    {order.replacement_reason === 'not_as_described' && ' Not as Described'}
                                    {order.replacement_reason === 'damaged_during_delivery' && ' Damaged During Delivery'}
                                    {order.replacement_reason === 'other' && ' Other'}
                                </p>
                            )}
                            {order.replacement_notes && (
                                <p className="text-sm text-blue-700 mt-1 italic">"{order.replacement_notes}"</p>
                            )}
                            {order.replacement_order_id && order.replacement_order && (
                                <div className="mt-2 pt-2 border-t border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-1">Replacement Order:</p>
                                    <Link
                                        href={`/orders/${order.replacement_order.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Order #{order.replacement_order.order_number || order.replacement_order.id}
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Order Timeline */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-6">Order Timeline</h2>
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        
                        <div className="space-y-6">
                            {/* Ordered */}
                            <div className="relative flex items-start">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                    order.created_at ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                    <CheckCircleIcon className={`h-5 w-5 ${
                                        order.created_at ? 'text-white' : 'text-gray-500'
                                    }`} />
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-sm font-semibold ${
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

                <CancellationReasonModal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    onConfirm={handleCancelConfirm}
                    loading={cancelling}
                    isCustomer={true}
                />

                <ReturnReasonModal
                    isOpen={showReturnModal}
                    onClose={() => setShowReturnModal(false)}
                    onConfirm={handleReturnConfirm}
                    loading={requestingReturn}
                    orderItems={order?.items || []}
                />

                <ReplacementReasonModal
                    isOpen={showReplacementModal}
                    onClose={() => setShowReplacementModal(false)}
                    onConfirm={handleReplacementConfirm}
                    loading={requestingReplacement}
                    orderItems={order?.items || []}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">Order Items</h2>
                            
                            <div className="space-y-4">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    
                                    // Item-level return/replacement status
                                    const hasReturnStatus = item.return_status;
                                    const hasReplacementStatus = item.replacement_status;
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
                                                    Quantity: {item.quantity} × ₹{Number(item.price || 0).toFixed(2)}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {/* Return Eligibility Badge */}
                                                    {item.is_returnable !== false ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            ✓ Returnable
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            ✗ Not Returnable
                                                        </span>
                                                    )}
                                                    
                                                    {/* Replacement Eligibility Badge */}
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
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="font-bold text-indigo-600">
                                                    ₹{Number(item.subtotal || 0).toFixed(2)}
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
                            
                            <div className="space-y-3">
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
                                    <p><span className="font-semibold">Address:</span> {order.address}</p>
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
                                
                                <div className="pt-2 border-t">
                                    <p>
                                        <span className="font-semibold">Payment Method:</span>{' '}
                                        <span className="capitalize">Cash on Delivery</span>
                                    </p>
                                </div>
                                
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
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && order.coupon_code && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({order.coupon_code.code})</span>
                                        <span>-₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>₹{shipping.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4 mb-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

