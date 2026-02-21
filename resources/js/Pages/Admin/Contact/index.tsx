import { useEffect, useState } from 'react';
import { useContactStore } from './useContactStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import toast from '../../../utils/toast';
import Pagination from '../../../Components/Pagination';
import {
    EnvelopeIcon,
    TrashIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export default function ContactIndex() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [contactCounts, setContactCounts] = useState<any>({
        total: 0,
        unread: 0,
        read: 0,
    });
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteContactId, setDeleteContactId] = useState<number | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadContacts();
        loadContactCounts();
    }, [selectedFilter, dateRange, currentPage]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                loadContacts();
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const loadContactCounts = async () => {
        try {
            const response = await useContactStore.getCounts();
            if (response.data?.status) {
                setContactCounts(response.data.data || {});
            }
        } catch (error) {
            console.error('Error loading contact counts:', error);
        }
    };

    const loadContacts = async () => {
        try {
            setLoading(true);
            const requestData: any = {
                page: currentPage,
                per_page: 15,
            };
            
            if (selectedFilter !== 'all') {
                requestData.is_read = selectedFilter === 'read' ? 1 : 0;
            }
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }

            if (searchQuery.trim()) {
                requestData.search = searchQuery.trim();
            }
            
            const response = await useContactStore.list(requestData);
            if (response.data?.status) {
                setContacts(response.data.data?.data || []);
                setPagination(response.data.data);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
        setCurrentPage(1);
    };

    const handleViewContact = async (contactId: number) => {
        try {
            const response = await useContactStore.show({ id: contactId });
            if (response.data?.status) {
                setSelectedContact(response.data.data);
                setShowViewModal(true);
                loadContacts();
                loadContactCounts();
            }
        } catch (error) {
            console.error('Error loading contact:', error);
        }
    };

    const handleMarkAsRead = async (contactId: number) => {
        try {
            const response = await useContactStore.markAsRead({ id: contactId });
            if (response.data?.status) {
                loadContacts();
                loadContactCounts();
                toast({ message: 'Contact marked as read', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error marking as read:', error);
            toast({ message: error.response?.data?.message || 'Failed to mark as read', type: 'error' });
        }
    };

    const handleMarkAsUnread = async (contactId: number) => {
        try {
            const response = await useContactStore.markAsUnread({ id: contactId });
            if (response.data?.status) {
                loadContacts();
                loadContactCounts();
                toast({ message: 'Contact marked as unread', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error marking as unread:', error);
            toast({ message: error.response?.data?.message || 'Failed to mark as unread', type: 'error' });
        }
    };

    const handleDeleteClick = (contactId: number) => {
        setDeleteContactId(contactId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteContactId) return;
        
        try {
            const response = await useContactStore.delete({ id: deleteContactId });
            if (response.data?.status) {
                loadContacts();
                loadContactCounts();
                setShowDeleteModal(false);
                setDeleteContactId(null);
                toast({ message: 'Contact deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete contact');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting contact:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete contact';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout currentPath="/admin/contacts">
            <div className="space-y-6">
                <div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage customer contact form submissions</p>
                    </div>
                    
                    {/* Filter Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <button
                            onClick={() => {
                                setSelectedFilter('all');
                                setCurrentPage(1);
                            }}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedFilter === 'all'
                                    ? 'bg-indigo-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <EnvelopeIcon className={`h-8 w-8 ${selectedFilter === 'all' ? 'text-white' : 'text-gray-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">All Messages</span>
                                <span className={`text-2xl font-bold ${selectedFilter === 'all' ? 'text-white' : 'text-gray-900'}`}>
                                    {contactCounts.total}
                                </span>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => {
                                setSelectedFilter('unread');
                                setCurrentPage(1);
                            }}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedFilter === 'unread'
                                    ? 'bg-red-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <XCircleIcon className={`h-8 w-8 ${selectedFilter === 'unread' ? 'text-white' : 'text-red-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">Unread</span>
                                <span className={`text-2xl font-bold ${selectedFilter === 'unread' ? 'text-white' : 'text-gray-900'}`}>
                                    {contactCounts.unread}
                                </span>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => {
                                setSelectedFilter('read');
                                setCurrentPage(1);
                            }}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedFilter === 'read'
                                    ? 'bg-green-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <CheckCircleIcon className={`h-8 w-8 ${selectedFilter === 'read' ? 'text-white' : 'text-green-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">Read</span>
                                <span className={`text-2xl font-bold ${selectedFilter === 'read' ? 'text-white' : 'text-gray-900'}`}>
                                    {contactCounts.read}
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, subject, or message..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Range
                                </label>
                                <FormDatePicker
                                    value={dateRange}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacts Table */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                                <p className="mt-4 text-gray-600">Loading contacts...</p>
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center py-12">
                                <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-gray-600">No contacts found</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name / Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subject
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Message Preview
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
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
                                            {contacts.map((contact) => (
                                                <tr key={contact.id} className={!contact.is_read ? 'bg-blue-50' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {!contact.is_read && (
                                                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                                                <div className="text-sm text-gray-500">{contact.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 font-medium">{contact.subject}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-500 line-clamp-2 max-w-md">
                                                            {contact.message}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {formatDate(contact.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {contact.is_read ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Read
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Unread
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewContact(contact.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded"
                                                                title="View"
                                                            >
                                                                <EyeIcon className="h-5 w-5" />
                                                            </button>
                                                            {contact.is_read ? (
                                                                <button
                                                                    onClick={() => handleMarkAsUnread(contact.id)}
                                                                    className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded"
                                                                    title="Mark as unread"
                                                                >
                                                                    <XCircleIcon className="h-5 w-5" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(contact.id)}
                                                                    className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
                                                                    title="Mark as read"
                                                                >
                                                                    <CheckCircleIcon className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteClick(contact.id)}
                                                                className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
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
                                
                                {/* Pagination */}
                                {pagination && pagination.last_page > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200">
                                        <Pagination
                                            data={pagination}
                                            baseUrl="/admin/contacts"
                                            onPageChange={(page) => setCurrentPage(page)}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* View Contact Modal */}
            {showViewModal && selectedContact && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-gray-900">Contact Message</h2>
                                <button
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedContact(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <p className="text-gray-900">{selectedContact.name}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <p className="text-gray-900">{selectedContact.email}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <p className="text-gray-900 font-medium">{selectedContact.subject}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <p className="text-gray-500">{formatDate(selectedContact.created_at)}</p>
                                </div>
                                
                                <div className="flex gap-2 pt-4 border-t">
                                    {selectedContact.is_read ? (
                                        <button
                                            onClick={() => {
                                                handleMarkAsUnread(selectedContact.id);
                                                setShowViewModal(false);
                                            }}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                        >
                                            Mark as Unread
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                handleMarkAsRead(selectedContact.id);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Mark as Read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowViewModal(false);
                                            handleDeleteClick(selectedContact.id);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeleteContactId(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Contact"
                message="Are you sure you want to delete this contact message? This action cannot be undone."
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

