import { useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, CheckIcon, MapPinIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAddressStore } from './useAddressStore';
import FormInput from '../../Components/FormInput/FormInput';
import Button from '../../Components/Button';
import AlertModal from '../../Components/AlertModal';
import ConfirmationModal from '../../Components/ConfirmationModal';

interface Address {
    id: number;
    name: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    address_type: string;
    is_default: boolean;
}

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (address: Address) => void;
    selectedAddressId?: number | null;
}

export default function AddressModal({ isOpen, onClose, onSelect, selectedAddressId }: AddressModalProps) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        district: 'Valsad',
        city: 'Vapi',
        postal_code: '',
        country: 'India',
        state: 'Gujarat',
        address_type: 'home',
        is_default: false,
    });

    useEffect(() => {
        if (isOpen) {
            loadAddresses();
            setShowForm(false);
            setEditingAddress(null);
        }
    }, [isOpen]);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const response = await useAddressStore.list();
            if (response.data?.status) {
                setAddresses(response.data.data || []);
            }
        } catch (error: any) {
            console.error('Error loading addresses:', error);
            setAlertMessage('Failed to load addresses');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            setLoading(true);
            let response;
            
            if (editingAddress) {
                response = await useAddressStore.update({
                    id: editingAddress.id,
                    ...formData,
                });
            } else {
                response = await useAddressStore.store(formData);
            }

            if (response.data?.status) {
                await loadAddresses();
                setShowForm(false);
                setEditingAddress(null);
                resetForm();
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
            setAlertMessage(error.response?.data?.message || 'Failed to save address');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            name: address.name,
            phone: address.phone,
            address: address.address,
            district: address.district || 'Valsad',
            city: address.city || 'Vapi',
            postal_code: address.postal_code,
            country: address.country || 'India',
            state: 'Gujarat',
            address_type: address.address_type || 'home',
            is_default: address.is_default,
        });
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        setAddressToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!addressToDelete) return;
        
        try {
            setLoading(true);
            const response = await useAddressStore.delete({ id: addressToDelete });
            if (response.data?.status) {
                await loadAddresses();
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
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
            setAddressToDelete(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            setLoading(true);
            const response = await useAddressStore.setDefault({ id });
            if (response.data?.status) {
                await loadAddresses();
                setAlertMessage('Default address updated');
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
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            address: '',
            district: 'Valsad',
            city: 'Vapi',
            postal_code: '',
            country: 'India',
            state: 'Gujarat',
            address_type: 'home',
            is_default: false,
        });
    };

    const handleNewAddress = () => {
        resetForm();
        setEditingAddress(null);
        setShowForm(true);
    };

    const handleSelectAddress = (address: Address) => {
        onSelect(address);
        onClose();
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingAddress(null);
        resetForm();
    };

    if (!isOpen) return null;

    const addressTypeColors: { [key: string]: string } = {
        home: 'bg-teal-600',
        work: 'bg-blue-600',
        other: 'bg-gray-600',
    };

    const addressTypeLabels: { [key: string]: string } = {
        home: 'Home',
        work: 'Work',
        other: 'Other',
    };

    return (
        <>
            <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <div
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={onClose}
                    ></div>

                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl w-full">
                        {/* Header */}
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900" id="modal-title">
                                    Select Address
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white px-6 py-4">
                            {!showForm ? (
                                <>
                                    {/* Add New Address Button */}
                                    <div className="mb-4">
                                        <button
                                            type="button"
                                            onClick={handleNewAddress}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                                        >
                                            <PlusIcon className="h-5 w-5" />
                                            <span className="font-medium">Add New Address</span>
                                        </button>
                                    </div>

                                    {/* Addresses List */}
                                    <div className="max-h-[60vh] overflow-y-auto space-y-3">
                                        {loading && addresses.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                <p className="mt-2 text-sm text-gray-500">Loading addresses...</p>
                                            </div>
                                        ) : addresses.length === 0 ? (
                                            <div className="text-center py-12">
                                                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses</h3>
                                                <p className="mt-1 text-sm text-gray-500">Get started by adding a new address.</p>
                                            </div>
                                        ) : (
                                            addresses.map((address) => (
                                                <div
                                                    key={address.id}
                                                    className={`relative border-2 rounded-lg p-5 transition-all ${
                                                        selectedAddressId === address.id
                                                            ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                                >
                                                    {/* Selected Indicator */}
                                                    {selectedAddressId === address.id && (
                                                        <div className="absolute top-4 right-4">
                                                            <div className="flex items-center justify-center w-6 h-6 bg-indigo-600 rounded-full">
                                                                <CheckIcon className="h-4 w-4 text-white" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Address Header */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-base font-semibold text-gray-900">
                                                                    {address.name}
                                                                </span>
                                                                {address.address_type && (
                                                                    <span
                                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium text-white ${
                                                                            addressTypeColors[address.address_type] || 'bg-gray-600'
                                                                        }`}
                                                                    >
                                                                        {addressTypeLabels[address.address_type] || address.address_type}
                                                                    </span>
                                                                )}
                                                                {address.is_default && (
                                                                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(address)}
                                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                                title="Edit"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(address.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                title="Delete"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Address Details */}
                                                    <div className="space-y-1 mb-4">
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {address.address}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {address.district && `${address.district}, `}{address.city}, {address.postal_code}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Gujarat, {address.country}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            <span className="font-medium">Phone:</span> {address.phone}
                                                        </p>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectAddress(address)}
                                                            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                                                selectedAddressId === address.id
                                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                            }`}
                                                        >
                                                            {selectedAddressId === address.id ? (
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <CheckIcon className="h-5 w-5" />
                                                                    Selected
                                                                </span>
                                                            ) : (
                                                                'Deliver Here'
                                                            )}
                                                        </button>
                                                        {!address.is_default && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetDefault(address.id)}
                                                                disabled={loading}
                                                                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                            >
                                                                Set Default
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Address Form */
                                <div className="max-h-[60vh] overflow-y-auto">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {editingAddress ? 'Update your address details' : 'Enter your address information'}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormInput
                                                label="Full Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <FormInput
                                                label="Phone Number"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        
                                        <FormInput
                                            label="Street Address"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    District <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="district"
                                                    value={formData.district}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    required
                                                >
                                                    <option value="Valsad">Valsad</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    City <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    required
                                                >
                                                    <option value="Vapi">Vapi</option>
                                                </select>
                                            </div>
                                            <FormInput
                                                label="Postal Code"
                                                name="postal_code"
                                                value={formData.postal_code}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Country
                                                </label>
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                                    {formData.country}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    State
                                                </label>
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                                    {formData.state}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Address Type
                                            </label>
                                            <select
                                                name="address_type"
                                                value={formData.address_type}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            >
                                                <option value="home">Home</option>
                                                <option value="work">Work</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_default"
                                                name="is_default"
                                                checked={formData.is_default}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
                                                Set as default address
                                            </label>
                                        </div>
                                        
                                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {loading ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleCancelForm}
                                                disabled={loading}
                                                className="px-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                message={alertMessage}
                type={alertType}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setAddressToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Address"
                message="Are you sure you want to delete this address? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonColor="red"
                loading={loading}
            />
        </>
    );
}
