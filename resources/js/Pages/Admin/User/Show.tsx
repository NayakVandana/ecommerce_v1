import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useUserStore } from './useUserStore';
import AdminLayout from '../Layout';
import DetailPageSkeleton from '../../../Components/Skeleton/DetailPageSkeleton';
import { 
    ArrowLeftIcon,
    UserIcon,
    ShieldCheckIcon,
    ShoppingBagIcon,
    EnvelopeIcon,
    PhoneIcon,
    CalendarIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';

export default function UserShow() {
    const { props, url } = usePage();
    const userId = (props as any).id;
    
    // Get section from URL query parameter if coming from orders page
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const fromOrders = urlParams.get('from') === 'orders';
    const orderSection = urlParams.get('section') || 'all';
    
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await useUserStore.show({ id: userId });
            if (response.data?.status && response.data?.data) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
            }`}>
                {role === 'admin' ? (
                    <>
                        <ShieldCheckIcon className="h-4 w-4 mr-1" />
                        Admin
                    </>
                ) : (
                    <>
                        <UserIcon className="h-4 w-4 mr-1" />
                        User
                    </>
                )}
            </span>
        );
    };

    if (loading) {
        return (
            <AdminLayout currentPath="/admin/users">
                <DetailPageSkeleton />
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout currentPath="/admin/users">
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-gray-500 text-lg mb-4">User not found</p>
                    <Link
                        href="/admin/users"
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Back to Users
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const orders = user.orders || [];

    return (
        <AdminLayout currentPath="/admin/users">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={fromOrders ? (orderSection === 'all' ? '/admin/orders/all' : `/admin/orders/${orderSection}`) : "/admin/users"}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-6 w-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                            <p className="mt-1 text-sm text-gray-500">View user information and order history</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                                    <span className="text-indigo-600 font-bold text-3xl">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                                <div className="mb-4">
                                    {getRoleBadge(user.role || 'user')}
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-gray-200 pt-6">
                                <div className="flex items-start">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                    </div>
                                </div>

                                {user.phone && (
                                    <div className="flex items-start">
                                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start">
                                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Registered</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {user.addresses && user.addresses.length > 0 && (
                                    <div className="flex items-start">
                                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 mb-2">Addresses</p>
                                            <div className="space-y-2">
                                                {user.addresses.map((address: any, index: number) => (
                                                    <div key={address.id || index} className="border rounded p-2 bg-gray-50">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium text-gray-900">{address.name}</span>
                                                            {address.address_type && (
                                                                <span className={`px-2 py-0.5 rounded text-xs text-white ${
                                                                    address.address_type === 'home' ? 'bg-teal-600' :
                                                                    address.address_type === 'work' ? 'bg-blue-600' :
                                                                    'bg-gray-600'
                                                                }`}>
                                                                    {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
                                                                </span>
                                                            )}
                                                            {address.is_default && (
                                                                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-600">{address.address}</p>
                                                        <p className="text-xs text-gray-600">{address.city}, {address.postal_code}, {address.country}</p>
                                                        <p className="text-xs text-gray-600">Phone: {address.phone}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Orders History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <ShoppingBagIcon className="h-6 w-6 mr-2" />
                                    Order History ({orders.length})
                                </h2>
                            </div>

                            {orders.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Order ID
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map((order: any) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {order.order_number || `#${order.id}`}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₹{Number(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={`/admin/orders/${order.id}${fromOrders ? `?section=${orderSection}` : ''}`}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
                                    <p className="mt-1 text-sm text-gray-500">This user hasn't placed any orders yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

