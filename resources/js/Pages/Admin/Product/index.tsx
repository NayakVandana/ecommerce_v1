import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useProductStore } from './useProductStore';
import AdminLayout from '../Layout';
import Pagination from '../../../Components/Pagination';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

export default function ProductIndex() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [products, setProducts] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    useEffect(() => {
        loadProducts();
    }, [currentPage]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await useProductStore.list({ page: currentPage });
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

    const handleDelete = async (productId: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            const response = await useProductStore.delete({ id: productId });
            if (response.data?.status) {
                loadProducts();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    return (
        <AdminLayout currentPath="/admin/products">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
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
                                                    <div className="flex-shrink-0 h-10 w-10">
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
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {product.product_name}
                                                        </div>
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
                                                        onClick={() => handleDelete(product.id)}
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
            </div>
        </AdminLayout>
    );
}

