import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useRecentlyViewedStore } from './useRecentlyViewedStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Pagination from '../../../Components/Pagination';

export default function RecentlyViewedIndex() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    const searchQuery = urlParams.get('search') || '';
    const userTypeFilter = urlParams.get('user_type') || '';
    
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(searchQuery);
    const [userType, setUserType] = useState(userTypeFilter);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        loadRecentlyViewed();
    }, [currentPage, searchQuery, userTypeFilter, dateRange]);

    const loadRecentlyViewed = async () => {
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
            
            const response = await useRecentlyViewedStore.list(requestData);
            if (response.data?.status) {
                const paginationData = response.data.data;
                setRecentlyViewed(paginationData?.data || []);
                if (paginationData) {
                    setPagination(paginationData);
                }
            }
        } catch (error) {
            console.error('Error loading recently viewed products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (userType) params.set('user_type', userType);
        window.location.href = `/admin/recently-viewed?${params.toString()}`;
    };

    const handleFilterChange = (value: string) => {
        setUserType(value);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (value) params.set('user_type', value);
        window.location.href = `/admin/recently-viewed?${params.toString()}`;
    };

    const handleShow = async (id: number) => {
        try {
            setLoadingDetails(true);
            const response = await useRecentlyViewedStore.show({ id });
            if (response.data?.status) {
                setSelectedItem(response.data.data);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error loading recently viewed product details:', error);
            alert('Failed to load recently viewed product details');
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this recently viewed product?')) return;
        
        try {
            const response = await useRecentlyViewedStore.delete({ id });
            if (response.data?.status) {
                loadRecentlyViewed();
            }
        } catch (error) {
            console.error('Error deleting recently viewed product:', error);
            alert('Failed to delete recently viewed product');
        }
    };

    return (
        <AdminLayout currentPath="/admin/recently-viewed">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Recently Viewed Products</h1>
                    <p className="mt-2 text-sm text-gray-600">View and manage customer recently viewed products</p>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search by Product Name
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    User Type
                                </label>
                                <select
                                    value={userType}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Users</option>
                                    <option value="authenticated">Authenticated</option>
                                    <option value="guest">Guest</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    Search
                                </button>
                                {(search || userType) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setUserType('');
                                            window.location.href = '/admin/recently-viewed';
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="w-full sm:w-auto min-w-[280px]">
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
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Viewed At
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentlyViewed.length > 0 ? (
                                        recentlyViewed.map((item: any) => {
                                            const product = item.product;
                                            const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                            const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                            
                                            // Calculate price
                                            const price = parseFloat(product?.final_price || product?.price || '0');
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50">
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
                                                                {product?.categoryRelation && (
                                                                    <div className="text-sm text-gray-500">
                                                                        {product.categoryRelation.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {item.user ? (
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.user.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {item.user.email}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="text-sm text-gray-500">Guest</div>
                                                                <div className="text-xs text-gray-400">
                                                                    Session: {item.session_id?.substring(0, 8)}...
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ${price.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.viewed_at ? new Date(item.viewed_at).toLocaleString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
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
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No recently viewed products found
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
                                    baseUrl="/admin/recently-viewed"
                                    queryParams={{
                                        ...(search && { search }),
                                        ...(userType && { user_type: userType }),
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Show Details Modal */}
                {showModal && selectedItem && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Recently Viewed Product Details</h3>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>

                                    {loadingDetails ? (
                                        <div className="flex items-center justify-center h-64">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Product Information */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">Product Information</h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-start space-x-4">
                                                        {selectedItem.product?.media?.[0] && (
                                                            <img
                                                                src={selectedItem.product.media[0].url || selectedItem.product.media[0].file_path}
                                                                alt={selectedItem.product.product_name}
                                                                className="h-24 w-24 object-cover rounded-md"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <h5 className="text-lg font-semibold text-gray-900">
                                                                {selectedItem.product?.product_name || 'N/A'}
                                                            </h5>
                                                            {selectedItem.product?.categoryRelation && (
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Category: {selectedItem.product.categoryRelation.name}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                Price: ${parseFloat(selectedItem.product?.final_price || selectedItem.product?.price || '0').toFixed(2)}
                                                            </p>
                                                            {selectedItem.product?.description && (
                                                                <p className="text-sm text-gray-600 mt-2">
                                                                    {selectedItem.product.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Information */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    {selectedItem.user ? (
                                                        <div>
                                                            <p className="text-sm text-gray-900">
                                                                <span className="font-medium">Name:</span> {selectedItem.user.name}
                                                            </p>
                                                            <p className="text-sm text-gray-900 mt-2">
                                                                <span className="font-medium">Email:</span> {selectedItem.user.email}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-2">
                                                                <span className="font-medium">Type:</span> Authenticated User
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-sm text-gray-900">
                                                                <span className="font-medium">Type:</span> Guest User
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-2">
                                                                <span className="font-medium">Session ID:</span> {selectedItem.session_id}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* View Information */}
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900 mb-3">View Information</h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-sm text-gray-900">
                                                        <span className="font-medium">Viewed At:</span> {selectedItem.viewed_at ? new Date(selectedItem.viewed_at).toLocaleString() : 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        <span className="font-medium">Record ID:</span> {selectedItem.id}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        <span className="font-medium">Created:</span> {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

