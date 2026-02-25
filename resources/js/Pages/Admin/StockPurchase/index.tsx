import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { useStockPurchaseStore } from './useStockPurchaseStore';
import AdminLayout from '../Layout';
import Pagination from '../../../Components/Pagination';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import { TableSkeleton } from '../../../Components/Skeleton';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CubeIcon
} from '@heroicons/react/24/outline';

export default function StockPurchaseIndex() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [stockPurchases, setStockPurchases] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStockPurchaseId, setDeleteStockPurchaseId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStockPurchase, setEditingStockPurchase] = useState<any>(null);
    const [formData, setFormData] = useState({
        shop_name: '',
        mobile: '',
        address: '',
        notes: '',
        amount: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadStockPurchases();
    }, [currentPage]);

    const loadStockPurchases = async () => {
        try {
            setLoading(true);
            const requestData: any = { 
                page: currentPage,
                per_page: 15
            };
            
            if (searchTerm) {
                requestData.search = searchTerm;
            }
            
            const response = await useStockPurchaseStore.list(requestData);
            if (response.data?.status) {
                setStockPurchases(response.data.data?.data || []);
                setPagination(response.data.data);
            }
        } catch (error) {
            console.error('Error loading stock purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadStockPurchases();
    };

    const handleDeleteClick = (stockPurchaseId: number) => {
        setDeleteStockPurchaseId(stockPurchaseId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteStockPurchaseId) return;
        
        try {
            const response = await useStockPurchaseStore.delete({ id: deleteStockPurchaseId });
            if (response.data?.status) {
                loadStockPurchases();
                setShowDeleteModal(false);
                setDeleteStockPurchaseId(null);
                toast({ message: 'Stock purchase deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete stock purchase');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting stock purchase:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete stock purchase';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleCreateClick = () => {
        setShowCreateModal(true);
        setFormData({
            shop_name: '',
            mobile: '',
            address: '',
            notes: '',
            amount: '',
        });
    };

    const handleEditClick = (stockPurchase: any) => {
        setEditingStockPurchase(stockPurchase);
        setFormData({
            shop_name: stockPurchase.shop_name || '',
            mobile: stockPurchase.mobile || '',
            address: stockPurchase.address || '',
            notes: stockPurchase.notes || '',
            amount: stockPurchase.amount || '',
        });
        setShowEditModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.shop_name || !formData.mobile || !formData.amount) {
            setAlertMessage('Please fill in all required fields');
            setAlertType('error');
            setShowAlert(true);
            return;
        }

        try {
            setSubmitting(true);
            const data = {
                ...formData,
                amount: parseFloat(formData.amount),
            };

            let response;
            if (showEditModal && editingStockPurchase) {
                response = await useStockPurchaseStore.update({
                    id: editingStockPurchase.id,
                    ...data,
                });
            } else {
                response = await useStockPurchaseStore.store(data);
            }

            if (response.data?.status) {
                toast({ 
                    message: showEditModal 
                        ? 'Stock purchase updated successfully' 
                        : 'Stock purchase created successfully', 
                    type: 'success' 
                });
                setShowCreateModal(false);
                setShowEditModal(false);
                setEditingStockPurchase(null);
                setFormData({
                    shop_name: '',
                    mobile: '',
                    address: '',
                    notes: '',
                    amount: '',
                });
                loadStockPurchases();
            } else {
                setAlertMessage(response.data?.message || 'Failed to save stock purchase');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error saving stock purchase:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save stock purchase';
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setSubmitting(false);
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setEditingStockPurchase(null);
        setFormData({
            shop_name: '',
            mobile: '',
            address: '',
            notes: '',
            amount: '',
        });
    };

    return (
        <AdminLayout currentPath="/admin/stock-purchases">
            <div className="space-y-6">
                <div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Stock Purchase Management</h1>
                            <p className="mt-2 text-sm text-gray-600">Manage stock purchases from suppliers</p>
                        </div>
                        <button
                            onClick={handleCreateClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Stock Purchase
                        </button>
                    </div>
                    
                    {/* Search */}
                    <div className="bg-white shadow rounded-lg p-4 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by shop name, mobile, or address..."
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSearch}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {loading ? (
                            <TableSkeleton />
                        ) : stockPurchases.length === 0 ? (
                            <div className="text-center py-12">
                                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No stock purchases</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new stock purchase.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {stockPurchases.map((purchase) => (
                                                <tr key={purchase.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {purchase.shop_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {purchase.mobile}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {purchase.address || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        ₹{Number(purchase.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {purchase.notes ? (
                                                            <span className="truncate block max-w-xs" title={purchase.notes}>
                                                                {purchase.notes}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(purchase.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditClick(purchase)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(purchase.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {pagination && (
                                    <div className="px-4 py-3 border-t border-gray-200">
                                        <Pagination
                                            currentPage={currentPage}
                                            lastPage={pagination.last_page}
                                            perPage={pagination.per_page}
                                            total={pagination.total}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={closeModal} />
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {showEditModal ? 'Edit Stock Purchase' : 'Create Stock Purchase'}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Shop Name *</label>
                                            <input
                                                type="text"
                                                value={formData.shop_name}
                                                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Mobile *</label>
                                            <input
                                                type="text"
                                                value={formData.mobile}
                                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Address</label>
                                            <textarea
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                rows={3}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Amount *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                                min="0"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows={3}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                    >
                                        {submitting ? (showEditModal ? 'Updating...' : 'Creating...') : (showEditModal ? 'Update' : 'Create')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Stock Purchase"
                message="Are you sure you want to delete this stock purchase? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                message={alertMessage}
                type={alertType}
            />
        </AdminLayout>
    );
}

