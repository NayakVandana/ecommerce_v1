import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useCartStore } from './useCartStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import toast from '../../../utils/toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import Pagination from '../../../Components/Pagination';

export default function CartIndex() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    const searchQuery = urlParams.get('search') || '';
    const userTypeFilter = urlParams.get('user_type') || '';
    
    const [carts, setCarts] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchQuery);
    const [userType, setUserType] = useState(userTypeFilter);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCartId, setDeleteCartId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadCarts();
    }, [currentPage, searchQuery, userTypeFilter, dateRange]);

    const loadCarts = async () => {
        try {
            setLoading(true);
            const requestData: any = {
                page: currentPage,
                per_page: 15,
            };
            
            if (searchQuery) {
                requestData.search = searchQuery;
            }
            
            if (userTypeFilter) {
                requestData.user_type = userTypeFilter;
            }
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useCartStore.list(requestData);
            if (response.data?.status) {
                const paginationData = response.data.data;
                setCarts(paginationData?.data || []);
                if (paginationData) {
                    setPagination(paginationData);
                }
            }
        } catch (error) {
            console.error('Error loading carts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (userType) params.set('user_type', userType);
        window.location.href = `/admin/carts?${params.toString()}`;
    };

    const handleFilterChange = (value: string) => {
        setUserType(value);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (value) params.set('user_type', value);
        window.location.href = `/admin/carts?${params.toString()}`;
    };

    const handleDeleteClick = (cartId: number) => {
        setDeleteCartId(cartId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCartId) return;
        
        try {
            const response = await useCartStore.delete({ id: deleteCartId });
            if (response.data?.status) {
                loadCarts();
                setShowDeleteModal(false);
                setDeleteCartId(null);
                toast({ message: 'Cart item deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete cart item');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting cart:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete cart item';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    return (
        <AdminLayout currentPath="/admin/carts">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Shopping Carts</h1>
                    <p className="mt-2 text-sm text-gray-600">View and manage customer shopping carts</p>
                </div>

                {/* Inline Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <form onSubmit={handleSearch}>
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search by Product Name
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User Type
                                </label>
                                <select
                                    value={userType}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                    <option value="">All Users</option>
                                    <option value="authenticated">Authenticated</option>
                                    <option value="guest">Guest</option>
                                </select>
                            </div>
                            <div className="flex-shrink-0 min-w-[280px]">
                                <FormDatePicker
                                    title="Filter by Date"
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
                                    handleDateChange={(dates: any) => setDateRange(dates)}
                                    noMaxDate={false}
                                    noMinLimit={false}
                                    className="text-sm"
                                    popoverDirection="down"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
                                >
                                    Search
                                </button>
                                {(search || userType || (dateRange.startDate && dateRange.endDate)) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setUserType('');
                                            setDateRange({ startDate: null, endDate: null });
                                            window.location.href = '/admin/carts';
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {carts.length > 0 ? (
                                        carts.map((cart: any) => {
                                            const product = cart.product;
                                            const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                            const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                            
                                            // Calculate price and subtotal
                                            const price = parseFloat(product?.final_price || product?.price || '0');
                                            const quantity = parseInt(cart.quantity || '1', 10);
                                            const subtotal = price * quantity;
                                            
                                            return (
                                                <tr key={cart.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <Link 
                                                                href={`/admin/products/${product?.id}`}
                                                                className="flex-shrink-0 h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                                                            >
                                                                {imageUrl ? (
                                                                    <img
                                                                        className="h-12 w-12 rounded-md object-cover"
                                                                        src={imageUrl}
                                                                        alt={product?.product_name}
                                                                    />
                                                                ) : (
                                                                    <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center">
                                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                                    </div>
                                                                )}
                                                            </Link>
                                                            <div className="ml-4">
                                                                <Link 
                                                                    href={`/admin/products/${product?.id}`}
                                                                    className="text-sm font-medium text-gray-900 hover:text-indigo-600 cursor-pointer"
                                                                >
                                                                    {product?.product_name || 'N/A'}
                                                                </Link>
                                                                {cart.variation && (
                                                                    <div className="text-sm text-gray-500">
                                                                        {cart.variation.size && `Size: ${cart.variation.size} `}
                                                                        {cart.variation.color && `Color: ${cart.variation.color}`}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {cart.user ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {cart.user.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {cart.user.email}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="text-sm text-gray-500">Guest</div>
                                                                <div className="text-xs text-gray-400">
                                                                    Session: {cart.session_id?.substring(0, 8)}...
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {quantity}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₹{price.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        ₹{subtotal.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(cart.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleDeleteClick(cart.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No cart items found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-4">
                                <Pagination 
                                    data={pagination} 
                                    baseUrl="/admin/carts"
                                    queryParams={{
                                        ...(search && { search }),
                                        ...(userType && { user_type: userType }),
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteCartId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Cart Item"
                    message="Are you sure you want to delete this cart item? This action cannot be undone."
                    confirmText="Delete"
                    cancelText="Cancel"
                    confirmButtonColor="red"
                />

                {/* Alert Modal */}
                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    message={alertMessage}
                    type={alertType}
                />
            </div>
        </AdminLayout>
    );
}

