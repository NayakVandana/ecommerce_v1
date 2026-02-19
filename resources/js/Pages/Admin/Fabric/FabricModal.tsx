import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFabricStore } from './useFabricStore';
import toast from '../../../utils/toast';

export default function FabricModal({
    isOpen,
    onClose,
    fabric,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    fabric: any;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        fabric_name: '',
        description: '',
        sort_order: 0,
        is_active: true,
    });
    const [errors, setErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (fabric) {
            setFormData({
                fabric_name: fabric.fabric_name || '',
                description: fabric.description || '',
                sort_order: fabric.sort_order || 0,
                is_active: fabric.is_active !== undefined ? fabric.is_active : true,
            });
        } else {
            setFormData({
                fabric_name: '',
                description: '',
                sort_order: 0,
                is_active: true,
            });
        }
        setErrors({});
    }, [fabric, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'sort_order' ? parseInt(value) || 0 : value)
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);

        try {
            const submitData: any = {
                fabric_name: formData.fabric_name.trim(),
                description: formData.description.trim() || null,
                sort_order: parseInt(formData.sort_order.toString()) || 0,
                is_active: formData.is_active,
            };

            let response;
            if (fabric) {
                response = await useFabricStore.update({ id: fabric.id, ...submitData });
            } else {
                response = await useFabricStore.store(submitData);
            }

            if (response.data?.status) {
                toast({ 
                    message: fabric ? 'Fabric updated successfully' : 'Fabric created successfully', 
                    type: 'success' 
                });
                onSuccess();
            } else {
                const errorMsg = response.data?.message || 'Failed to save fabric';
                setErrors({ submit: errorMsg });
            }
        } catch (error: any) {
            console.error('Error saving fabric:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save fabric';
            const errorData = error.response?.data?.errors || {};
            setErrors({ submit: errorMessage, ...errorData });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {fabric ? 'Edit Fabric' : 'Create New Fabric'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {errors.submit && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{errors.submit}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Fabric Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fabric_name"
                                    value={formData.fabric_name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="e.g., Cotton, Polyester, Silk"
                                    required
                                />
                                {errors.fabric_name && <p className="mt-1 text-sm text-red-600">{errors.fabric_name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="e.g., 100% Pure Cotton, Breathable and comfortable"
                                />
                                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        name="sort_order"
                                        value={formData.sort_order}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="0"
                                    />
                                    {errors.sort_order && <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>}
                                </div>

                                <div className="flex items-end">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : fabric ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

