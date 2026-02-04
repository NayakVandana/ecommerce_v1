import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCouponStore } from './useCouponStore';
import FormDatePicker from '../../../Components/FormInput/FormDatePicker';
import toast from '../../../utils/toast';

export default function CouponModal({
    isOpen,
    onClose,
    coupon,
    onSuccess,
}: any) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        type: 'percentage',
        value: '',
        min_purchase_amount: '',
        max_discount_amount: '',
        start_date: null as Date | null,
        end_date: null as Date | null,
        usage_limit: '',
        usage_limit_per_user: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (coupon) {
            setFormData({
                code: coupon.code || '',
                name: coupon.name || '',
                description: coupon.description || '',
                type: coupon.type || 'percentage',
                value: coupon.value || '',
                min_purchase_amount: coupon.min_purchase_amount || '',
                max_discount_amount: coupon.max_discount_amount || '',
                start_date: coupon.start_date ? new Date(coupon.start_date) : null,
                end_date: coupon.end_date ? new Date(coupon.end_date) : null,
                usage_limit: coupon.usage_limit || '',
                usage_limit_per_user: coupon.usage_limit_per_user || '',
                is_active: coupon.is_active !== undefined ? coupon.is_active : true,
            });
        } else {
            setFormData({
                code: '',
                name: '',
                description: '',
                type: 'percentage',
                value: '',
                min_purchase_amount: '',
                max_discount_amount: '',
                start_date: null,
                end_date: null,
                usage_limit: '',
                usage_limit_per_user: '',
                is_active: true,
            });
        }
        setErrors({});
    }, [coupon, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (dates: any) => {
        setFormData(prev => ({
            ...prev,
            start_date: dates?.startDate || null,
            end_date: dates?.endDate || null,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);

        try {
            const submitData: any = {
                ...formData,
                code: formData.code.toUpperCase(),
                value: parseFloat(formData.value as any) || 0,
                min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount as any) : null,
                max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount as any) : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit as any) : null,
                usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user as any) : null,
                start_date: formData.start_date ? formData.start_date.toISOString() : null,
                end_date: formData.end_date ? formData.end_date.toISOString() : null,
            };

            let response;
            if (coupon) {
                response = await useCouponStore.update({ id: coupon.id, ...submitData });
            } else {
                response = await useCouponStore.store(submitData);
            }

            if (response.data?.status) {
                toast({ 
                    message: coupon ? 'Coupon updated successfully' : 'Coupon created successfully', 
                    type: 'success' 
                });
                onSuccess();
            } else {
                const errorMsg = response.data?.message || 'Failed to save coupon';
                setErrors({ submit: errorMsg });
            }
        } catch (error: any) {
            console.error('Error saving coupon:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save coupon';
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

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {coupon ? 'Edit Coupon' : 'Create New Coupon'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Code *</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="WELCOME10"
                                        required
                                        disabled={!!coupon}
                                    />
                                    {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Welcome Discount"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="10% off on your first purchase"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Value *</label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder={formData.type === 'percentage' ? '10' : '50.00'}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Min Purchase Amount</label>
                                    <input
                                        type="number"
                                        name="min_purchase_amount"
                                        value={formData.min_purchase_amount}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Discount Amount</label>
                                    <input
                                        type="number"
                                        name="max_discount_amount"
                                        value={formData.max_discount_amount}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Period</label>
                                <FormDatePicker
                                    title="Select Date Range"
                                    isRange={true}
                                    useRange={true}
                                    value={formData.start_date && formData.end_date ? {
                                        startDate: formData.start_date,
                                        endDate: formData.end_date
                                    } : null}
                                    handleDateChange={handleDateChange}
                                    noMaxDate={false}
                                    noMinLimit={false}
                                    className="text-sm"
                                    popoverDirection="down"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
                                    <input
                                        type="number"
                                        name="usage_limit"
                                        value={formData.usage_limit}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="1000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Usage Limit Per User</label>
                                    <input
                                        type="number"
                                        name="usage_limit_per_user"
                                        value={formData.usage_limit_per_user}
                                        onChange={handleInputChange}
                                        min="1"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">Active</label>
                            </div>

                            {errors.submit && (
                                <div className="text-sm text-red-600">{errors.submit}</div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (coupon ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

