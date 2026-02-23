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
    const [useCustomAmount, setUseCustomAmount] = useState(false);
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
        custom_total_amount: '',
        payment_method: 'CASH_ON_DELIVERY',
        payment_type: 'CASH',
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

    // Helper function to get payment method display label
    const getPaymentMethodLabel = (value: string) => {
        const labels: any = {
            'CASH_ON_DELIVERY': 'Cash on Delivery',
            'ONLINE_PAYMENT': 'Online Payment',
            'BANK_TRANSFER': 'Bank Transfer',
            'UPI': 'UPI',
            'CREDIT_CARD': 'Credit Card',
            'DEBIT_CARD': 'Debit Card',
            'WALLET': 'Wallet',
            'OTHER': 'Other',
        };
        return labels[value] || value;
    };

    // Helper function to get payment type display label
    const getPaymentTypeLabel = (value: string) => {
        const labels: any = {
            'CASH': 'Cash',
            'ONLINE': 'Online',
            'OTHER': 'Other',
        };
        return labels[value] || value;
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
                setUseCustomAmount(false);
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
                    custom_total_amount: '',
                    payment_method: 'CASH_ON_DELIVERY',
                    payment_type: 'CASH',
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

                        {product && (() => {
                            const unitPrice = Number(product.final_price || product.price || 0);
                            const costPrice = Number(product.cost_price || 0);
                            const calculatedTotal = unitPrice * formData.quantity;
                            const totalCostPrice = costPrice * formData.quantity;
                            const customAmount = parseFloat(formData.custom_total_amount || '0');
                            const finalAmount = useCustomAmount && customAmount > 0 ? customAmount : calculatedTotal;
                            
                            // Calculate profit and profit margin when custom amount is used
                            const profit = useCustomAmount && customAmount > 0 ? customAmount - totalCostPrice : calculatedTotal - totalCostPrice;
                            const profitMargin = finalAmount > 0 ? (profit / finalAmount) * 100 : 0;
                            
                            return (
                                <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                                    <p className="text-sm font-medium text-gray-900 mb-2">{product.product_name}</p>
                                    {selectedVariation && (
                                        <p className="text-xs text-gray-600 mb-1">
                                            {selectedVariation.color && `Color: ${selectedVariation.color}`}
                                            {selectedVariation.size && ` | Size: ${selectedVariation.size}`}
                                        </p>
                                    )}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Unit Price:</span>
                                            <span className="font-medium">₹{unitPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Quantity:</span>
                                            <span className="font-medium">{formData.quantity}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-t pt-2">
                                            <span className="text-gray-700 font-medium">Calculated Total:</span>
                                            <span className="font-semibold text-indigo-600">₹{calculatedTotal.toFixed(2)}</span>
                                        </div>
                                        
                                        {/* Custom Amount Toggle */}
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <input
                                                type="checkbox"
                                                id="useCustomAmount"
                                                checked={useCustomAmount}
                                                onChange={(e) => {
                                                    setUseCustomAmount(e.target.checked);
                                                    if (!e.target.checked) {
                                                        setFormData(prev => ({ ...prev, custom_total_amount: '' }));
                                                    }
                                                }}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="useCustomAmount" className="text-sm font-medium text-gray-700 cursor-pointer">
                                                Use Custom/Bargained Amount
                                            </label>
                                        </div>
                                        
                                        {useCustomAmount && (
                                            <div className="pt-2 space-y-2">
                                                {/* Cost Price Information - Always show when custom amount is enabled */}
                                                {costPrice > 0 && (
                                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                        <p className="text-xs font-semibold text-blue-800 mb-2 uppercase tracking-wide">Cost Information</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-700">Unit Cost Price:</span>
                                                                <span className="font-medium text-gray-900">₹{costPrice.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-700">Quantity:</span>
                                                                <span className="font-medium text-gray-900">{formData.quantity}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm pt-1 border-t border-blue-300">
                                                                <span className="text-gray-800 font-semibold">Total Cost Price:</span>
                                                                <span className="font-bold text-blue-700">₹{totalCostPrice.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Custom Payment Amount <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="custom_total_amount"
                                                        value={formData.custom_total_amount}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        step="0.01"
                                                        required={useCustomAmount}
                                                        className="w-full px-3 py-2 border-2 border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                        placeholder="Enter bargained amount"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Enter the final amount after bargaining/negotiation
                                                    </p>
                                                </div>
                                                
                                                {/* Cost Price & Profit Information - Show when custom amount is entered */}
                                                {costPrice > 0 && customAmount > 0 && (
                                                    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                                        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Profit Analysis</p>
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600">Cost Price (Total):</span>
                                                                <span className="font-medium text-gray-900">₹{totalCostPrice.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-600">Selling Price:</span>
                                                                <span className="font-medium text-indigo-600">₹{customAmount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm pt-1 border-t">
                                                                <span className="text-gray-700 font-medium">Profit:</span>
                                                                <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {profit >= 0 ? '+' : ''}₹{profit.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-700 font-medium">Profit Margin:</span>
                                                                <span className={`font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {profitMargin >= 0 ? '+' : ''}{profitMargin.toFixed(2)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-300">
                                            <span className="text-base font-bold text-gray-900">Final Amount:</span>
                                            <span className={`text-2xl font-bold ${useCustomAmount && customAmount !== calculatedTotal ? 'text-green-600' : 'text-indigo-600'}`}>
                                                ₹{finalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        {useCustomAmount && customAmount !== calculatedTotal && (
                                            <div className="text-xs text-center pt-1">
                                                <span className={`font-medium ${customAmount < calculatedTotal ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {customAmount < calculatedTotal 
                                                        ? `Discount: ₹${(calculatedTotal - customAmount).toFixed(2)}` 
                                                        : `Additional: ₹${(customAmount - calculatedTotal).toFixed(2)}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

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

                            {/* Payment Method & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method *
                                    </label>
                                    <select
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                                        <option value="ONLINE_PAYMENT">Online Payment</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CREDIT_CARD">Credit Card</option>
                                        <option value="DEBIT_CARD">Debit Card</option>
                                        <option value="WALLET">Wallet</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Type *
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, payment_type: 'CASH' }))}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                formData.payment_type === 'CASH'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Cash
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, payment_type: 'ONLINE' }))}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                formData.payment_type === 'ONLINE'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Online
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, payment_type: 'OTHER' }))}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                formData.payment_type === 'OTHER'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Other
                                        </button>
                                    </div>
                                    <input
                                        type="hidden"
                                        name="payment_type"
                                        value={formData.payment_type}
                                    />
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

