import { useEffect, useState } from 'react';
import { useFabricStore } from './useFabricStore';
import AdminLayout from '../Layout';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import FabricModal from './FabricModal';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function FabricIndex() {
    const [fabrics, setFabrics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingFabric, setEditingFabric] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteFabricId, setDeleteFabricId] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [pagination, setPagination] = useState<any>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    useEffect(() => {
        loadFabrics();
    }, []);

    const loadFabrics = async (page: number = 1) => {
        try {
            setLoading(true);
            const response = await useFabricStore.index({
                page,
                per_page: 15,
                search: search || undefined,
            });
            if (response.data?.status) {
                const data = response.data.data;
                setFabrics(data.data || []);
                setPagination({
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    per_page: data.per_page || 15,
                    total: data.total || 0,
                });
            }
        } catch (error) {
            console.error('Error loading fabrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadFabrics(1);
    };

    const handleToggleStatus = async (fabricId: number) => {
        try {
            const response = await useFabricStore.toggleStatus({ id: fabricId });
            if (response.data?.status) {
                loadFabrics(pagination.current_page);
                toast({ message: 'Fabric status updated successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error toggling status:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update fabric status';
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleDeleteClick = (fabricId: number) => {
        setDeleteFabricId(fabricId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteFabricId) return;
        
        try {
            const response = await useFabricStore.delete({ id: deleteFabricId });
            if (response.data?.status) {
                loadFabrics(pagination.current_page);
                setShowDeleteModal(false);
                setDeleteFabricId(null);
                toast({ message: 'Fabric deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete fabric');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting fabric:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete fabric';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingFabric(null);
    };

    const handleModalSuccess = () => {
        loadFabrics(pagination.current_page);
        setShowModal(false);
        setEditingFabric(null);
    };

    const handleEditClick = async (fabricId: number) => {
        try {
            const response = await useFabricStore.show({ id: fabricId });
            if (response.data?.status) {
                setEditingFabric(response.data.data);
                setShowModal(true);
            }
        } catch (error: any) {
            console.error('Error loading fabric:', error);
            toast({ message: 'Failed to load fabric details', type: 'error' });
        }
    };

    return (
        <AdminLayout currentPath="/admin/fabrics">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Fabric Management</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage fabric types for fashion products</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingFabric(null);
                            setShowModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Fabric
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search fabrics by name or description..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Search
                        </button>
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    loadFabrics(1);
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Fabrics Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading fabrics...</p>
                        </div>
                    ) : fabrics.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-500">No fabrics found</p>
                        </div>
                    ) : (
                        <>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fabric Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sort Order
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {fabrics.map((fabric) => (
                                        <tr key={fabric.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{fabric.fabric_name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-500 max-w-md truncate">
                                                    {fabric.description || '—'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{fabric.sort_order || 0}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(fabric.id)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        fabric.is_active
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {fabric.is_active ? (
                                                        <>
                                                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircleIcon className="h-3 w-3 mr-1" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(fabric.id)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(fabric.id)}
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

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => loadFabrics(pagination.current_page - 1)}
                                            disabled={pagination.current_page === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => loadFabrics(pagination.current_page + 1)}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{((pagination.current_page - 1) * pagination.per_page) + 1}</span> to{' '}
                                                <span className="font-medium">
                                                    {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
                                                </span>{' '}
                                                of <span className="font-medium">{pagination.total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => loadFabrics(pagination.current_page - 1)}
                                                    disabled={pagination.current_page === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                                    if (
                                                        page === 1 ||
                                                        page === pagination.last_page ||
                                                        (page >= pagination.current_page - 2 && page <= pagination.current_page + 2)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={page}
                                                                onClick={() => loadFabrics(page)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                    page === pagination.current_page
                                                                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    } else if (
                                                        page === pagination.current_page - 3 ||
                                                        page === pagination.current_page + 3
                                                    ) {
                                                        return (
                                                            <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                                <button
                                                    onClick={() => loadFabrics(pagination.current_page + 1)}
                                                    disabled={pagination.current_page === pagination.last_page}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Fabric Modal */}
            <FabricModal
                isOpen={showModal}
                onClose={handleModalClose}
                fabric={editingFabric}
                onSuccess={handleModalSuccess}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeleteFabricId(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Fabric"
                message="Are you sure you want to delete this fabric? This action cannot be undone. Products using this fabric will lose the fabric association."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
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

