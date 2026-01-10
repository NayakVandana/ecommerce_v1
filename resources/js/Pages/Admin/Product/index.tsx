import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useProductStore } from './useProductStore';
import AdminLayout from '../Layout';
import Pagination from '../../../Components/Pagination';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';

export default function ProductIndex() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [products, setProducts] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadProducts();
    }, [currentPage, dateRange]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const requestData: any = { page: currentPage };
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useProductStore.list(requestData);
            if (response.data?.status) {
                setProducts(response.data.data?.data || []);
                setPagination(response.data.data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const handleToggleStatus = async (productId: number) => {
        try {
            const response = await useProductStore.toggleStatus({ id: productId });
            if (response.data?.status) {
                loadProducts();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const handleDeleteClick = (productId: number) => {
        setDeleteProductId(productId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteProductId) return;
        
        try {
            const response = await useProductStore.delete({ id: deleteProductId });
            if (response.data?.status) {
                loadProducts();
                setShowDeleteModal(false);
                setDeleteProductId(null);
                toast({ message: 'Product deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete product');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting product:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete product';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    return (
        <AdminLayout currentPath="/admin/products">
            <div className="space-y-6">
                <div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                            <p className="mt-2 text-sm text-gray-600">Manage your product catalog</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingProduct(null);
                                setShowModal(true);
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Product
                        </button>
                    </div>
                    
                    {/* Inline Filters */}
                    <div className="bg-white shadow rounded-lg p-4">
                        <div className="flex flex-wrap items-center gap-3">
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

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length > 0 ? (
                                    products.map((product: any) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Link href={`/admin/products/${product.id}`} className="flex-shrink-0 h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                                                        {product.media?.[0]?.url ? (
                                                            <img
                                                                className="h-10 w-10 rounded-md object-cover"
                                                                src={product.media[0].url}
                                                                alt={product.product_name}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                                                <span className="text-gray-400 text-xs">No Image</span>
                                                            </div>
                                                        )}
                                                    </Link>
                                                    <div className="ml-4">
                                                        <Link 
                                                            href={`/admin/products/${product.id}`}
                                                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 cursor-pointer"
                                                        >
                                                            {product.product_name}
                                                        </Link>
                                                        <div className="text-sm text-gray-500">
                                                            SKU: {product.sku || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${product.final_price || product.price}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(product.id)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        product.is_approve === 1
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {product.is_approve === 1 ? (
                                                        <>
                                                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                            Approved
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircleIcon className="h-4 w-4 mr-1" />
                                                            Pending
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {product.total_quantity || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setShowModal(true);
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(product.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No products found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <Pagination 
                                data={pagination} 
                                baseUrl="/admin/products"
                            />
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteProductId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Product"
                    message="Are you sure you want to delete this product? This action cannot be undone."
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

