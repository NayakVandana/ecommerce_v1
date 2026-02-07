import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useDeliveryBoyStore } from './useDeliveryBoyStore';
import AppLayout from '../Layouts/AppLayout';
import AlertModal from '../../Components/AlertModal';
import { TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function DeliveryBoyIndex() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [otpCodes, setOtpCodes] = useState<{[key: number]: string}>({});
    const [verifyingOTP, setVerifyingOTP] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadOrders();
        loadStats();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await useDeliveryBoyStore.list({ status: 'out_for_delivery' });
            if (response.data?.status) {
                setOrders(response.data.data?.data || response.data.data || []);
            }
        } catch (error: any) {
            console.error('Error loading orders:', error);
            if (error.response?.status === 403) {
                setAlertMessage('You do not have permission to access this page');
                setAlertType('error');
                setShowAlert(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await useDeliveryBoyStore.getStats();
            if (response.data?.status) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleVerifyOTP = async (orderId: number) => {
        const otpCode = otpCodes[orderId] || '';
        if (!otpCode || otpCode.length !== 6) {
            setAlertMessage('Please enter a valid 6-digit OTP');
            setAlertType('warning');
            setShowAlert(true);
            return;
        }

        try {
            setVerifyingOTP(orderId);
            const response = await useDeliveryBoyStore.verifyOTP({
                id: orderId,
                otp: otpCode,
            });

            if (response.data?.status) {
                // Optimistically remove the order from the list
                setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
                
                // Clear OTP for this order
                setOtpCodes(prev => {
                    const newCodes = { ...prev };
                    delete newCodes[orderId];
                    return newCodes;
                });
                
                setAlertMessage('OTP verified successfully! Order marked as delivered.');
                setAlertType('success');
                setShowAlert(true);
                setSelectedOrder(null);
                
                // Reload orders and stats
                await loadOrders();
                await loadStats();
            } else {
                setAlertMessage(response.data?.message || 'Invalid OTP code');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to verify OTP');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setVerifyingOTP(null);
        }
    };

    const handleOtpChange = (orderId: number, value: string) => {
        setOtpCodes(prev => ({
            ...prev,
            [orderId]: value.replace(/\D/g, '')
        }));
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage your assigned orders and complete deliveries</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <TruckIcon className="h-8 w-8 text-indigo-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_orders || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <ClockIcon className="h-8 w-8 text-yellow-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Pending Delivery</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending_delivery || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Delivered</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.delivered || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Today's Deliveries</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.today_deliveries || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Assigned Orders</h2>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders assigned</h3>
                            <p className="mt-1 text-sm text-gray-500">You don't have any orders assigned for delivery yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {orders
                                .filter((order: any) => order.status === 'out_for_delivery' && !order.otp_verified)
                                .map((order: any) => (
                                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Order #{order.order_number || order.id}
                                                </h3>
                                                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    Out for Delivery
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                                                    <p className="text-sm font-medium text-gray-900">{order.name}</p>
                                                    <p className="text-sm text-gray-600">{order.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                                                    <p className="text-sm text-gray-900">{order.address}</p>
                                                    <p className="text-sm text-gray-600">{order.city}, {order.postal_code}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <p className="text-xs text-gray-500 mb-1">Order Total</p>
                                                <p className="text-lg font-bold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="ml-6">
                                            {order.otp_code && !order.otp_verified ? (
                                                <div className="w-80 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                                                    <p className="text-sm font-semibold text-gray-900 mb-2">Delivery OTP</p>
                                                    <div className="bg-white rounded-md p-3 mb-3 text-center border border-indigo-300">
                                                        <p className="text-xs text-gray-600 mb-1">OTP Code</p>
                                                        <p className="text-2xl font-mono font-bold text-indigo-600">{order.otp_code}</p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-sm font-semibold text-gray-900 mb-2">Enter OTP to Complete Delivery</p>
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={otpCodes[order.id] || ''}
                                                            onChange={(e) => handleOtpChange(order.id, e.target.value)}
                                                            placeholder="Enter 6-digit OTP"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerifyOTP(order.id)}
                                                            disabled={(otpCodes[order.id] || '').length !== 6 || verifyingOTP === order.id}
                                                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {verifyingOTP === order.id ? 'Verifying...' : 'Verify OTP & Complete Delivery'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : order.otp_verified ? (
                                                <div className="w-80 bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                                                    <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                                    <p className="text-sm font-semibold text-green-900">Order Delivered</p>
                                                    {order.delivered_at && (
                                                        <p className="text-xs text-green-700 mt-1">
                                                            Delivered on {new Date(order.delivered_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-80 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                                                    <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                                    <p className="text-sm font-semibold text-yellow-900">Waiting for OTP</p>
                                                    <p className="text-xs text-yellow-700 mt-1">OTP will be generated when order is ready</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
        </AppLayout>
    );
}

