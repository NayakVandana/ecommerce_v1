import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { useUserStore } from './useUserStore';
import AdminLayout from '../Layout';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import ConfirmationModal from '../../../Components/ConfirmationModal';
import AlertModal from '../../../Components/AlertModal';
import { TableSkeleton } from '../../../Components/Skeleton';
import toast from '../../../utils/toast';
import {
    PencilIcon,
    TrashIcon,
    ShieldCheckIcon,
    UserIcon,
    TruckIcon
} from '@heroicons/react/24/outline';

export default function UserIndex() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'user' | 'delivery_boy'>('all');
    const [userCounts, setUserCounts] = useState<any>({
        all: 0,
        admin: 0,
        user: 0,
        delivery_boy: 0
    });
    const [dateRange, setDateRange] = useState<any>({
        startDate: null,
        endDate: null,
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
    const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number; newRole: string } | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');

    useEffect(() => {
        // Get current user ID from localStorage
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setCurrentUserId(userData.id || null);
            } catch (error) {
                console.error('Error parsing auth user:', error);
            }
        }
        loadUsers();
    }, [dateRange, selectedRole]);

    useEffect(() => {
        loadUserCounts();
    }, []);

    const loadUserCounts = async () => {
        try {
            // Load counts for all roles
            const [allResponse, adminResponse, userResponse, deliveryBoyResponse] = await Promise.all([
                useUserStore.list({}),
                useUserStore.list({ role: 'admin' }),
                useUserStore.list({ role: 'user' }),
                useUserStore.list({ role: 'delivery_boy' })
            ]);
            
            setUserCounts({
                all: allResponse.data?.data?.total || allResponse.data?.data?.data?.length || 0,
                admin: adminResponse.data?.data?.total || adminResponse.data?.data?.data?.length || 0,
                user: userResponse.data?.data?.total || userResponse.data?.data?.data?.length || 0,
                delivery_boy: deliveryBoyResponse.data?.data?.total || deliveryBoyResponse.data?.data?.data?.length || 0
            });
        } catch (error) {
            console.error('Error loading user counts:', error);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const requestData: any = {};
            
            if (selectedRole !== 'all') {
                requestData.role = selectedRole;
            }
            
            if (dateRange.startDate && dateRange.endDate) {
                requestData.start_date = dateRange.startDate;
                requestData.end_date = dateRange.endDate;
            }
            
            const response = await useUserStore.list(requestData);
            if (response.data?.status) {
                setUsers(response.data.data?.data || []);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (dates: any) => {
        setDateRange(dates);
    };

    const formatRoleName = (role: string | null | undefined): string => {
        if (!role) return 'User';
        
        // Convert snake_case to Title Case
        return role
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        // If changing own role, show confirmation
        if (currentUserId && userId === currentUserId) {
            setPendingRoleChange({ userId, newRole });
            setShowRoleChangeModal(true);
            return;
        }
        
        await performRoleChange(userId, newRole);
    };

    const performRoleChange = async (userId: number, newRole: string) => {
        try {
            const response = await useUserStore.update({ 
                id: userId, 
                role: newRole 
            });
            if (response.data?.status) {
                loadUsers();
                loadUserCounts();
                toast({ message: 'User role updated successfully', type: 'success' });
            } else {
                setAlertMessage(response.data?.message || 'Failed to update user role');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error updating role:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to update user role');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setShowRoleChangeModal(false);
            setPendingRoleChange(null);
        }
    };

    const confirmRoleChange = async () => {
        if (pendingRoleChange) {
            await performRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
        }
    };

    const handleDeleteClick = (userId: number) => {
        setDeleteUserId(userId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteUserId) return;
        
        try {
            const response = await useUserStore.delete({ id: deleteUserId });
            if (response.data?.status) {
                loadUsers();
                loadUserCounts();
                setShowDeleteModal(false);
                setDeleteUserId(null);
                toast({ message: 'User deleted successfully', type: 'success' });
            } else {
                setShowDeleteModal(false);
                setAlertMessage(response.data?.message || 'Failed to delete user');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting user:', error);
            const errorMessage = error.response?.data?.message || 'Failed to delete user';
            setShowDeleteModal(false);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    return (
        <AdminLayout currentPath="/admin/users">
            <div className="space-y-6">
                <div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage user accounts</p>
                    </div>
                    
                    {/* Role Filter Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <button
                            onClick={() => setSelectedRole('all')}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedRole === 'all'
                                    ? 'bg-indigo-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <UserIcon className={`h-8 w-8 ${selectedRole === 'all' ? 'text-white' : 'text-gray-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">All Users</span>
                                <span className={`text-2xl font-bold ${selectedRole === 'all' ? 'text-white' : 'text-gray-900'}`}>
                                    {userCounts.all}
                                </span>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setSelectedRole('admin')}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedRole === 'admin'
                                    ? 'bg-purple-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <ShieldCheckIcon className={`h-8 w-8 ${selectedRole === 'admin' ? 'text-white' : 'text-purple-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">Admins</span>
                                <span className={`text-2xl font-bold ${selectedRole === 'admin' ? 'text-white' : 'text-gray-900'}`}>
                                    {userCounts.admin}
                                </span>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setSelectedRole('user')}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedRole === 'user'
                                    ? 'bg-gray-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <UserIcon className={`h-8 w-8 ${selectedRole === 'user' ? 'text-white' : 'text-gray-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">Regular Users</span>
                                <span className={`text-2xl font-bold ${selectedRole === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                    {userCounts.user}
                                </span>
                            </div>
                        </button>
                        
                        <button
                            onClick={() => setSelectedRole('delivery_boy')}
                            className={`p-4 rounded-lg shadow-md transition-all cursor-pointer ${
                                selectedRole === 'delivery_boy'
                                    ? 'bg-blue-500 ring-4 ring-offset-2 ring-white text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2">
                                    <TruckIcon className={`h-8 w-8 ${selectedRole === 'delivery_boy' ? 'text-white' : 'text-blue-600'}`} />
                                </div>
                                <span className="text-sm font-semibold mb-1">Delivery Boys</span>
                                <span className={`text-2xl font-bold ${selectedRole === 'delivery_boy' ? 'text-white' : 'text-gray-900'}`}>
                                    {userCounts.delivery_boy}
                                </span>
                            </div>
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
                    <TableSkeleton rows={8} columns={5} />
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Registered
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length > 0 ? (
                                    users.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <span className="text-indigo-600 font-semibold">
                                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <Link
                                                            href={`/admin/users/${user.id}`}
                                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline"
                                                        >
                                                            {user.name}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (user.role === 'admin') {
                                                                setSelectedRole('admin');
                                                            } else if (user.role === 'delivery_boy') {
                                                                setSelectedRole('delivery_boy');
                                                            } else {
                                                                setSelectedRole('user');
                                                            }
                                                        }}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                                                            user.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                                                : user.role === 'delivery_boy'
                                                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                        }`}
                                                        title={`Click to filter by ${formatRoleName(user.role)} role`}
                                                    >
                                                        {user.role === 'admin' ? (
                                                            <>
                                                                <ShieldCheckIcon className="h-4 w-4 mr-1" />
                                                                Admin
                                                            </>
                                                        ) : user.role === 'delivery_boy' ? (
                                                            <>
                                                                <TruckIcon className="h-4 w-4 mr-1" />
                                                                {formatRoleName(user.role)}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserIcon className="h-4 w-4 mr-1" />
                                                                {formatRoleName(user.role)}
                                                            </>
                                                        )}
                                                    </button>
                                                    <select
                                                        value={user.role || 'user'}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            const newRole = e.target.value;
                                                            if (newRole !== user.role) {
                                                                handleRoleChange(user.id, newRole);
                                                            }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                                                        title="Change user role"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="delivery_boy">Delivery Boy</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleDeleteClick(user.id)}
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
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setDeleteUserId(null);
                    }}
                    onConfirm={handleDeleteConfirm}
                    title="Delete User"
                    message="Are you sure you want to delete this user? This action cannot be undone."
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

                {/* Role Change Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showRoleChangeModal}
                    onClose={() => {
                        setShowRoleChangeModal(false);
                        setPendingRoleChange(null);
                    }}
                    onConfirm={confirmRoleChange}
                    title="Change Your Own Role"
                    message={`Are you sure you want to change your own role to "${pendingRoleChange ? formatRoleName(pendingRoleChange.newRole) : ''}"? This may affect your access to the admin panel.`}
                    confirmText="Yes, Change Role"
                    cancelText="Cancel"
                    confirmButtonColor="orange"
                />
            </div>
        </AdminLayout>
    );
}

