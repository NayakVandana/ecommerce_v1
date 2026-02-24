import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useCustomerStore } from './useCustomerStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import CustomerModal from './CustomerModal';
import { TableSkeleton } from '../../../Components/Skeleton';
import toast from '../../../utils/toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    NoSymbolIcon
} from '@heroicons/react/24/outline';

export default function CustomerIndex() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
    const [isRegistered, setIsRegistered] = useState<'all' | boolean>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        loadCustomers();
    }, [dateRange, selectedStatus, isRegistered, searchQuery]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const requestData: any = {};
            
            if (selectedStatus !== 'all') {
                requestData.status = selectedStatus;
            }
            
            if (isRegistered !== 'all') {
                requestData.is_registered = isRegistered;
            }
            
            if (searchQuery) {
                requestData.search = searchQuery;
            }
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useCustomerStore.list(requestData);
            if (response.data?.status) {
                setCustomers(response.data.data?.data || []);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const handleDeleteClick = (customerId: number) => {
        setDeleteCustomerId(customerId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteCustomerId) return;
        
        try {
            const response = await useCustomerStore.delete({ id: deleteCustomerId });
            if (response.data?.status) {
                loadCustomers();
                setShowDeleteModal(false);
                setDeleteCustomerId(null);
                toast({ message: 'Customer deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete customer');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting customer:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete customer';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleToggleStatus = async (customerId: number) => {
        try {
            const response = await useCustomerStore.toggleStatus({ id: customerId });
            if (response.data?.status) {
                loadCustomers();
                toast({ message: 'Customer status updated successfully', type: 'success' });
            } else {
                setAlertMessage(response.data?.message || 'Failed to update customer status');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error updating status:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to update customer status');
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const handleModalSuccess = () => {
        loadCustomers();
    };

    return (
        <AdminLayout currentPath="/admin/customers">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage customer accounts and information</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCustomer(null);
                            setShowModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add New Customer
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Name, email, phone..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>

                        {/* Registered Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={isRegistered === 'all' ? 'all' : isRegistered ? 'registered' : 'guest'}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setIsRegistered(value === 'all' ? 'all' : value === 'registered');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Customers</option>
                                <option value="registered">Registered</option>
                                <option value="guest">Guest</option>
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <FormDatePicker
                                title=""
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

                {loading ? (
                    <TableSkeleton rows={8} columns={7} />
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Orders
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Spent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customers.length > 0 ? (
                                    customers.map((customer: any) => (
                                        <tr key={customer.id} className="hover:bg-blue-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                            <span className="text-green-600 font-semibold">
                                                                {customer.name?.charAt(0).toUpperCase() || 'C'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <Link
                                                            href={`/admin/customers/${customer.id}`}
                                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline"
                                                        >
                                                            {customer.name}
                                                        </Link>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {customer.is_registered ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Registered
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                    Guest
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{customer.email || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{customer.phone || customer.mobile || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(customer.id)}
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                                                        customer.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : customer.status === 'blocked'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {customer.status === 'active' ? (
                                                        <>
                                                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                            Active
                                                        </>
                                                    ) : customer.status === 'blocked' ? (
                                                        <>
                                                            <NoSymbolIcon className="h-4 w-4 mr-1" />
                                                            Blocked
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircleIcon className="h-4 w-4 mr-1" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {customer.total_orders || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₹{parseFloat(customer.total_spent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {customer.created_at 
                                                    ? new Date(customer.created_at).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCustomer(customer);
                                                            setShowModal(true);
                                                        }}
                                                        className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                        title="Edit Customer"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(customer.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                        title="Delete Customer"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                            No customers found. Click "Add New Customer" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create/Edit Customer Modal */}
                <CustomerModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    editingCustomer={editingCustomer}
                    onSuccess={handleModalSuccess}
                />

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteCustomerId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Customer"
                    message="Are you sure you want to delete this customer? This action cannot be undone."
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

