import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useCustomerStore } from './useCustomerStore';
import AdminLayout from '../Layout';
import { 
    ArrowLeftIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    ShoppingBagIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function CustomerShow() {
    const { props } = usePage();
    const customerId = (props as any).id;
    
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (customerId) {
            fetchCustomer();
        }
    }, [customerId]);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const response = await useCustomerStore.show({ id: customerId });
            if (response.data?.status && response.data?.data) {
                setCustomer(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout currentPath="/admin/customers">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!customer) {
        return (
            <AdminLayout currentPath="/admin/customers">
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg mb-4">Customer not found</p>
                    <Link
                        href="/admin/customers"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to Customers
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const orders = customer.orders || [];

    return (
        <AdminLayout currentPath="/admin/customers">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/customers"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
                            <p className="mt-1 text-sm text-gray-500">View customer information and order history</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                    <span className="text-green-600 font-bold text-3xl">
                                        {customer.name?.charAt(0).toUpperCase() || 'C'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{customer.name}</h2>
                                <div className="mb-4">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        customer.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : customer.status === 'blocked'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {customer.status || 'active'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-gray-200 pt-6">
                                {customer.email && (
                                    <div className="flex items-start">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                                        </div>
                                    </div>
                                )}

                                {(customer.phone || customer.mobile) && (
                                    <div className="flex items-start">
                                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {customer.phone || customer.mobile}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {customer.address && (
                                    <div className="flex items-start">
                                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">Address</p>
                                            <p className="text-sm font-medium text-gray-900">{customer.address}</p>
                                            {(customer.city || customer.state || customer.postal_code) && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                            {customer.country && (
                                                <p className="text-sm text-gray-500">{customer.country}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start">
                                    <UserIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Type</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {customer.is_registered ? 'Registered Customer' : 'Guest Customer'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {customer.notes && (
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <p className="text-xs text-gray-500 mb-2">Notes</p>
                                    <p className="text-sm text-gray-700">{customer.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
                                <div className="flex items-center space-x-4">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Total Orders</p>
                                        <p className="text-2xl font-bold text-gray-900">{customer.total_orders_count || customer.total_orders || 0}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500">Total Spent</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₹{parseFloat(customer.total_spent_amount || customer.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map((order: any) => (
                                        <Link
                                            key={order.id}
                                            href={`/admin/orders/${order.id}`}
                                            className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">Order #{order.order_number}</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">
                                                        ₹{parseFloat(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">No orders found for this customer</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

