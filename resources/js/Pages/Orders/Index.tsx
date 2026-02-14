import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useOrderStore } from './useOrderStore';

export default function Index() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await useOrderStore.list();
            if (response.data?.status && response.data?.data) {
                const ordersData = response.data.data.data || response.data.data;
                setOrders(Array.isArray(ordersData) ? ordersData : []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors: any = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            'out_for_delivery': 'bg-indigo-100 text-indigo-800',
            'out-for-delivery': 'bg-indigo-100 text-indigo-800',
            'return_refund': 'bg-orange-100 text-orange-800',
            'return-refund': 'bg-orange-100 text-orange-800',
        };

        // Format status display - replace underscores and hyphens with spaces, then capitalize each word
        const statusDisplay = status
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                statusColors[status] || 'bg-gray-100 text-gray-800'
            }`}>
                {statusDisplay}
            </span>
        );
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading orders...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">You have no orders yet</p>
                        <Link
                            href="/categories"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order: any) => {
                            const items = order.items || [];
                            const itemCount = items.length;
                            const firstItem = items.length > 0 ? items[0] : null;
                            
                            const getProductImage = (item: any) => {
                                if (item?.product?.media && item.product.media.length > 0) {
                                    return item.product.media[0].url;
                                }
                                return '/images/placeholder-product.png';
                            };

                            const getProductName = (item: any) => {
                                return item?.product_name || item?.product?.product_name || 'Product';
                            };

                            return (
                                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                {/* Product Images */}
                                                {items.length > 0 && (
                                                    <div className="flex-shrink-0">
                                                        <div className="flex items-center space-x-2">
                                                            {items.slice(0, 3).map((item: any, index: number) => (
                                                                <div key={index} className="relative">
                                                                    <img
                                                                        src={getProductImage(item)}
                                                                        alt={getProductName(item)}
                                                                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                                                                        }}
                                                                    />
                                                                    {index === 2 && itemCount > 3 && (
                                                                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                                                            <span className="text-white text-xs font-bold">+{itemCount - 3}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            {items.length > 0 ? (
                                                                <>
                                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                        {getProductName(firstItem)}
                                                                    </h3>
                                                                    {itemCount > 1 && (
                                                                        <p className="text-sm text-gray-500 mb-2">
                                                                            {itemCount} item{itemCount > 1 ? 's' : ''} in this order
                                                                        </p>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                                    Order #{order.order_number || order.id}
                                                                </h3>
                                                            )}
                                                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                                <span>
                                                                    Order: <span className="font-medium">{order.order_number || `#${order.id}`}</span>
                                                                </span>
                                                                <span>
                                                                    Date: <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Status and Total */}
                                                        <div className="flex flex-col items-end space-y-2 ml-4">
                                                            <div>
                                                                {getStatusBadge(order.status)}
                                                            </div>
                                                            <div className="text-lg font-bold text-gray-900">
                                                                ₹{Number(order.total || 0).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Button */}
                                                    <div className="mt-4">
                                                        <Link
                                                            href={`/orders/${order.id}`}
                                                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                                        >
                                                            View Details
                                                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

