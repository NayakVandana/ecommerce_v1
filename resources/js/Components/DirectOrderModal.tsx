import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useOrderStore } from '../Pages/Admin/Order/useOrderStore';
import FormInput from './FormInput/FormInput';
import Button from './Button';
import toast from '../utils/toast';

interface DirectOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    selectedVariation?: any;
    quantity: number;
    onSuccess?: () => void;
}

export default function DirectOrderModal({
    isOpen,
    onClose,
    product,
    selectedVariation,
    quantity,
    onSuccess,
}: DirectOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        product_id: product?.id || null,
        variation_id: selectedVariation?.id || null,
        quantity: quantity || 1,
        name: '',
        email: '',
        phone: '',
        receiver_name: '',
        receiver_number: '',
        address: '',
        house_no: '',
        floor_no: '',
        building_name: '',
        landmark: '',
        district: 'Valsad',
        city: 'Vapi',
        postal_code: '',
        state: 'Gujarat',
        country: 'India',
        address_type: 'home',
        delivery_area: '',
        notes: '',
        coupon_code: '',
    });

    useEffect(() => {
        if (isOpen && product) {
            setFormData(prev => ({
                ...prev,
                product_id: product.id,
                variation_id: selectedVariation?.id || null,
                quantity: quantity || 1,
            }));
        }
    }, [isOpen, product, selectedVariation, quantity]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Auto-update city and state based on district
        if (name === 'district') {
            if (value === 'Valsad') {
                setFormData(prev => ({
                    ...prev,
                    district: 'Valsad',
                    city: 'Vapi',
                    state: 'Gujarat',
                }));
            } else if (value === 'Daman') {
                setFormData(prev => ({
                    ...prev,
                    district: 'Daman',
                    city: 'Moti Daman',
                    state: 'Daman and Diu (UT)',
                }));
            }
        }
    };

    const deliveryAreas = {
        Valsad: ['gunjan', 'charvada', 'vapi_char_rasta', 'vapi_station', 'vapi_gidc', 'pardi', 'valsad_city', 'dharampur'],
        Daman: ['moti_daman', 'nani_daman', 'daman_fort'],
    };

    const cities = {
        Valsad: ['Vapi', 'Pardi', 'Valsad City', 'Dharampur'],
        Daman: ['Moti Daman', 'Nani Daman', 'Daman Fort Area'],
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        if (!formData.receiver_number || !formData.address || !formData.delivery_area) {
            toast({ type: 'error', message: 'Please fill in all required fields' });
            return;
        }

        try {
            setLoading(true);
            const response = await useOrderStore.createDirectOrder(formData);
            
            if (response.data?.status) {
                toast({ type: 'success', message: 'Direct order created successfully' });
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
                // Reset form
                setFormData({
                    product_id: product?.id || null,
                    variation_id: selectedVariation?.id || null,
                    quantity: quantity || 1,
                    name: '',
                    email: '',
                    phone: '',
                    receiver_name: '',
                    receiver_number: '',
                    address: '',
                    house_no: '',
                    floor_no: '',
                    building_name: '',
                    landmark: '',
                    district: 'Valsad',
                    city: 'Vapi',
                    postal_code: '',
                    state: 'Gujarat',
                    country: 'India',
                    address_type: 'home',
                    delivery_area: '',
                    notes: '',
                    coupon_code: '',
                });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to create direct order' });
            }
        } catch (error: any) {
            console.error('Error creating direct order:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to create direct order' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentDeliveryAreas = deliveryAreas[formData.district as keyof typeof deliveryAreas] || [];
    const currentCities = cities[formData.district as keyof typeof cities] || [];

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Create Direct Order</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {product && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                                {selectedVariation && (
                                    <p className="text-xs text-gray-600">
                                        {selectedVariation.color && `Color: ${selectedVariation.color}`}
                                        {selectedVariation.size && ` | Size: ${selectedVariation.size}`}
                                    </p>
                                )}
                                <p className="text-sm text-gray-700">Quantity: {formData.quantity}</p>
                                <p className="text-sm font-semibold text-indigo-600">
                                    ₹{Number(product.final_price || product.price || 0).toFixed(2)} × {formData.quantity} = ₹{((product.final_price || product.price || 0) * formData.quantity).toFixed(2)}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    label="Customer Name *"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FormInput
                                    label="Email *"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FormInput
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                                <FormInput
                                    label="Receiver Name"
                                    name="receiver_name"
                                    value={formData.receiver_name}
                                    onChange={handleInputChange}
                                />
                                <FormInput
                                    label="Receiver Number *"
                                    name="receiver_number"
                                    value={formData.receiver_number}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Address *"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    multiline
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInput
                                    label="House No"
                                    name="house_no"
                                    value={formData.house_no}
                                    onChange={handleInputChange}
                                />
                                <FormInput
                                    label="Floor No"
                                    name="floor_no"
                                    value={formData.floor_no}
                                    onChange={handleInputChange}
                                />
                                <FormInput
                                    label="Building Name"
                                    name="building_name"
                                    value={formData.building_name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Landmark"
                                    name="landmark"
                                    value={formData.landmark}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        District *
                                    </label>
                                    <select
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="Valsad">Valsad</option>
                                        <option value="Daman">Daman</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City *
                                    </label>
                                    <select
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        {currentCities.map((city) => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <FormInput
                                    label="Postal Code *"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                        readOnly
                                    />
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address Type *
                                    </label>
                                    <select
                                        name="address_type"
                                        value={formData.address_type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="home">Home</option>
                                        <option value="office">Office</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Delivery Area *
                                    </label>
                                    <select
                                        name="delivery_area"
                                        value={formData.delivery_area}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select Delivery Area</option>
                                        {currentDeliveryAreas.map((area) => (
                                            <option key={area} value={area}>
                                                {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <FormInput
                                    label="Coupon Code"
                                    name="coupon_code"
                                    value={formData.coupon_code}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <FormInput
                                    label="Notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Order'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

