import AppLayout from '../Layouts/AppLayout';
import { useState, useEffect } from 'react';
import { useAddressStore } from '../Checkout/useAddressStore';
import Button from '../../Components/Button';
import AlertModal from '../../Components/AlertModal';
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon, HomeIcon, BuildingOfficeIcon, StarIcon } from '@heroicons/react/24/outline';

export default function AddressesIndex() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        address_type: 'home',
        is_default: false,
    });
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await useAddressStore.list();
            if (response.data?.status && response.data?.data) {
                setAddresses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleAddNew = () => {
        setEditingAddress(null);
        setFormData({
            name: '',
            phone: '',
            address: '',
            city: '',
            postal_code: '',
            country: '',
            address_type: 'home',
            is_default: false,
        });
        setErrors({});
        setShowModal(true);
    };

    const handleEdit = (address: any) => {
        setEditingAddress(address);
        setFormData({
            name: address.name || '',
            phone: address.phone || '',
            address: address.address || '',
            city: address.city || '',
            postal_code: address.postal_code || '',
            country: address.country || '',
            address_type: address.address_type || 'home',
            is_default: address.is_default || false,
        });
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            const response = await useAddressStore.delete({ id });
            if (response.data?.status) {
                await fetchAddresses();
                setAlertMessage('Address deleted successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to delete address');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting address:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to delete address');
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            const response = await useAddressStore.setDefault({ id });
            if (response.data?.status) {
                await fetchAddresses();
                setAlertMessage('Default address updated successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to set default address');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error setting default address:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to set default address');
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const response = editingAddress
                ? await useAddressStore.update({ ...formData, id: editingAddress.id })
                : await useAddressStore.store(formData);

            if (response.data?.status) {
                setShowModal(false);
                await fetchAddresses();
                setAlertMessage(editingAddress ? 'Address updated successfully' : 'Address added successfully');
                setAlertType('success');
                setShowAlert(true);
            } else {
                setAlertMessage(response.data?.message || 'Failed to save address');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error saving address:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            setAlertMessage(error.response?.data?.message || 'Failed to save address');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setSubmitting(false);
        }
    };

    const getAddressTypeIcon = (type: string) => {
        switch (type) {
            case 'home':
                return <HomeIcon className="h-5 w-5" />;
            case 'work':
                return <BuildingOfficeIcon className="h-5 w-5" />;
            default:
                return <MapPinIcon className="h-5 w-5" />;
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading addresses...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Your Addresses</h1>
                    <Button onClick={handleAddNew} variant="primary">
                        <PlusIcon className="h-5 w-5 inline mr-2" />
                        Add New Address
                    </Button>
                </div>

                {addresses.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <MapPinIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg mb-4">You have no saved addresses</p>
                        <Button onClick={handleAddNew} variant="primary">
                            <PlusIcon className="h-5 w-5 inline mr-2" />
                            Add Your First Address
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {addresses.map((address) => (
                            <div
                                key={address.id}
                                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                                    address.is_default ? 'border-indigo-500' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        {getAddressTypeIcon(address.address_type)}
                                        <span className="text-sm font-semibold text-gray-900 capitalize">
                                            {address.address_type}
                                        </span>
                                        {address.is_default && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                <StarIcon className="h-3 w-3 mr-1" />
                                                Default
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <p className="text-sm font-medium text-gray-900">{address.name}</p>
                                    <p className="text-sm text-gray-600">{address.phone}</p>
                                    <p className="text-sm text-gray-600">{address.address}</p>
                                    <p className="text-sm text-gray-600">
                                        {address.city}, {address.postal_code}
                                    </p>
                                    <p className="text-sm text-gray-600">{address.country}</p>
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    {!address.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(address.id)}
                                            className="flex-1 px-3 py-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            Set Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(address)}
                                        className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center justify-center gap-1"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-800"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                onClick={() => setShowModal(false)}
                            ></div>

                            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">
                                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone *
                                            </label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.phone ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address *
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                required
                                                rows={3}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.address ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.address && (
                                                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                        errors.city ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                />
                                                {errors.city && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Postal Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    name="postal_code"
                                                    value={formData.postal_code}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                        errors.postal_code ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                />
                                                {errors.postal_code && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.postal_code}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Country *
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                required
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                    errors.country ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.country && (
                                                <p className="mt-1 text-xs text-red-600">{errors.country}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Address Type
                                            </label>
                                            <select
                                                name="address_type"
                                                value={formData.address_type}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="home">Home</option>
                                                <option value="work">Work</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="is_default"
                                                id="is_default"
                                                checked={formData.is_default}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                                                Set as default address
                                            </label>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                disabled={submitting}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {submitting ? 'Saving...' : editingAddress ? 'Update' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    title={alertType === 'success' ? 'Success' : 'Error'}
                    message={alertMessage}
                    type={alertType}
                />
            </div>
        </AppLayout>
    );
}

