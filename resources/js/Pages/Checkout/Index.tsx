import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCartStore } from '../Cart/useCartStore';
import { useCheckoutStore } from './useCheckoutStore';
import { useCouponStore } from '../Products/useCouponStore';
import { isAuthenticated } from '../../utils/sessionStorage';
import FormInput from '../../Components/FormInput/FormInput';
import FormTextarea from '../../Components/FormInput/FormTextarea';
import Button from '../../Components/Button';
import toast from '../../utils/toast';
import { XMarkIcon, TicketIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function Index() {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    
    const [formData, setFormData] = useState({
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
        country: 'India',
        state: 'Gujarat',
        address_type: 'home',
        notes: '',
    });

    useEffect(() => {
        fetchCart();
        // Try to load user data if available
        const userStr = localStorage.getItem('auth_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setFormData(prev => ({
                    ...prev,
                    name: user.name || '',
                    email: user.email || '',
                    receiver_number: user.phone || user.mobile || '',
                }));
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await useCartStore.list();
            if (response.data?.status && response.data?.data) {
                setCart(response.data.data);
                
                // Redirect if cart is empty
                if (!response.data.data.items || response.data.data.items.length === 0) {
                    router.visit('/cart');
                }
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
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

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Name is required';
        }

        if (!formData.email || formData.email.trim() === '') {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.receiver_number || formData.receiver_number.trim() === '') {
            newErrors.receiver_number = 'Receiver number is required';
        }

        if (!formData.address || formData.address.trim() === '') {
            newErrors.address = 'Address is required';
        }

        if (!formData.district || formData.district.trim() === '') {
            newErrors.district = 'District is required';
        }
        if (!formData.city || formData.city.trim() === '') {
            newErrors.city = 'City is required';
        }
        if (formData.district !== 'Valsad') {
            newErrors.district = 'Only Valsad district is allowed for shipping';
        }
        if (formData.city !== 'Vapi') {
            newErrors.city = 'Only Vapi city is allowed for shipping';
        }

        if (!formData.postal_code || formData.postal_code.trim() === '') {
            newErrors.postal_code = 'Postal code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (!cart || !cart.items || cart.items.length === 0) {
            toast({ type: 'warning', message: 'Your cart is empty' });
            return;
        }
        
        try {
            setProcessing(true);
            setErrors({});

            // Use form data for order
            const orderData = {
                ...formData,
                use_cart: true,
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                payment_method: 'cash_on_delivery',
            };

            const response = await useCheckoutStore.placeOrder(orderData);

            if (response.data?.status && response.data?.data) {
                // Clear cart count
                window.dispatchEvent(new Event('cartUpdated'));
                
                // Redirect to order confirmation page
                router.visit(`/orders/${response.data.data.id}`, {
                    data: { order: response.data.data },
                });
            } else {
                toast({ type: 'error', message: response.data?.message || 'Failed to place order' });
            }
        } catch (error: any) {
            console.error('Error placing order:', error);
            
            if (error.response?.data?.message) {
                toast({ type: 'error', message: error.response.data.message });
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast({ type: 'error', message: 'Failed to place order. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading checkout...</p>
                </div>
            </AppLayout>
        );
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setValidatingCoupon(true);
        setCouponError('');

        try {
            const items = cart?.items || [];
            const subtotal = cart?.total || 0;
            
            const response = await useCouponStore.validate({
                code: couponCode.trim().toUpperCase(),
                subtotal: subtotal,
            });

            if (response.data?.status) {
                setAppliedCoupon(response.data.data.coupon);
                setCouponDiscount(response.data.data.discount);
                setCouponCode('');
                setCouponError('');
            } else {
                setCouponError(response.data?.message || 'Invalid coupon code');
                setAppliedCoupon(null);
                setCouponDiscount(0);
            }
        } catch (error: any) {
            console.error('Error validating coupon:', error);
            setCouponError(error.response?.data?.message || 'Failed to validate coupon');
            setAppliedCoupon(null);
            setCouponDiscount(0);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode('');
        setCouponError('');
    };

    const items = cart?.items || [];
    const total = cart?.total || 0;
    const subtotal = total;
    const tax = 0;
    const shipping = 0;
    const finalTotal = subtotal + tax + shipping - couponDiscount;

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                        <Link
                            href="/cart"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Return to Cart
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Checkout Steps Indicator */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <div className="flex items-center justify-center space-x-4">
                                <div className={`flex items-center ${currentStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        {currentStep > 1 ? '✓' : '1'}
                                    </div>
                                    <span className="ml-2 font-medium hidden sm:inline">Shipping</span>
                                </div>
                                <div className="w-16 h-0.5 bg-gray-300"></div>
                                <div className={`flex items-center ${currentStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        {currentStep > 2 ? '✓' : '2'}
                                    </div>
                                    <span className="ml-2 font-medium hidden sm:inline">Review</span>
                                </div>
                                <div className="w-16 h-0.5 bg-gray-300"></div>
                                <div className={`flex items-center ${currentStep >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        3
                                    </div>
                                    <span className="ml-2 font-medium hidden sm:inline">Payment</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Checkout Form */}
                            <div className="lg:col-span-2">
                                {/* Step 1: Shipping Information */}
                                {currentStep === 1 && (
                                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                    <h2 className="text-xl font-bold mb-4">Step 1: Shipping Information</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput
                                                label="Full Name"
                                                name="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                error={errors.name}
                                                required
                                            />
                                            <FormInput
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                error={errors.email}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput
                                                label="Receiver Name"
                                                name="receiver_name"
                                                type="text"
                                                value={formData.receiver_name}
                                                onChange={handleInputChange}
                                                error={errors.receiver_name}
                                                placeholder="Name of person receiving the order"
                                            />
                                            <FormInput
                                                label="Receiver Number"
                                                name="receiver_number"
                                                type="tel"
                                                value={formData.receiver_number}
                                                onChange={handleInputChange}
                                                error={errors.receiver_number}
                                                placeholder="Phone number of receiver"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Address Type <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex flex-wrap gap-4">
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="address_type"
                                                        value="home"
                                                        checked={formData.address_type === 'home'}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                        required
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Home</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="address_type"
                                                        value="office"
                                                        checked={formData.address_type === 'office'}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                        required
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Office</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="address_type"
                                                        value="other"
                                                        checked={formData.address_type === 'other'}
                                                        onChange={handleInputChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                        required
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">Other</span>
                                                </label>
                                            </div>
                                            {errors.address_type && (
                                                <p className="mt-1 text-xs text-red-600">{errors.address_type}</p>
                                            )}
                                        </div>

                                        <FormInput
                                            label="Address"
                                            name="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            error={errors.address}
                                            required
                                            placeholder="Street address"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput
                                                label="House No"
                                                name="house_no"
                                                type="text"
                                                value={formData.house_no}
                                                onChange={handleInputChange}
                                                error={errors.house_no}
                                                placeholder="House/Flat number"
                                            />
                                            <FormInput
                                                label="Floor No"
                                                name="floor_no"
                                                type="text"
                                                value={formData.floor_no}
                                                onChange={handleInputChange}
                                                error={errors.floor_no}
                                                placeholder="Floor number"
                                            />
                                        </div>

                                        <FormInput
                                            label="Building/Apartment Name"
                                            name="building_name"
                                            type="text"
                                            value={formData.building_name}
                                            onChange={handleInputChange}
                                            error={errors.building_name}
                                            placeholder="Building or apartment name"
                                        />

                                        <FormInput
                                            label="Landmark/Area"
                                            name="landmark"
                                            type="text"
                                            value={formData.landmark}
                                            onChange={handleInputChange}
                                            error={errors.landmark}
                                            placeholder="Nearby landmark or area name"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                {errors.district && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.district}</p>
                                                )}
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
                                                {errors.city && (
                                                    <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                                                )}
                                            </div>
                                            <FormInput
                                                label="Postal Code"
                                                name="postal_code"
                                                type="text"
                                                value={formData.postal_code}
                                                onChange={handleInputChange}
                                                error={errors.postal_code}
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

                                        <FormTextarea
                                            label="Order Notes (Optional)"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            error={errors.notes}
                                            rows={3}
                                        />
                                        
                                        <div className="flex justify-end mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (validateForm()) {
                                                        setCurrentStep(2);
                                                    }
                                                }}
                                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                                            >
                                                Continue to Review →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* Step 2: Order Review */}
                                {currentStep === 2 && (
                                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                        <h2 className="text-xl font-bold mb-4">Step 2: Review Your Order</h2>
                                        
                                        {/* Order Items Summary */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                                    
                                    <div className="space-y-4">
                                        {items.map((item: any) => {
                                            const product = item.product;
                                            const variation = item.variation;
                                            const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                            const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                            
                                            return (
                                                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden">
                                                            {imageUrl ? (
                                                                <img 
                                                                    src={imageUrl} 
                                                                    alt={product?.product_name} 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 text-xs flex items-center justify-center h-full">No Image</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">
                                                            {product?.product_name}
                                                        </h3>
                                                        {product?.brand && (
                                                            <p className="text-sm text-gray-500">Brand: {product.brand}</p>
                                                        )}
                                                        {variation && (
                                                            <p className="text-sm text-gray-500">
                                                                {variation.size && `Size: ${variation.size} `}
                                                                {variation.color && `Color: ${variation.color}`}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Quantity: {item.quantity} × ${((item.subtotal || 0) / item.quantity).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="text-right">
                                                        <p className="font-bold text-indigo-600">
                                                            ${(item.subtotal || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                        
                                        {/* Shipping Information Review */}
                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold mb-4">Shipping Details</h3>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                                <p><span className="font-semibold">Name:</span> {formData.name}</p>
                                                <p><span className="font-semibold">Email:</span> {formData.email}</p>
                                                {formData.receiver_name && (
                                                    <p><span className="font-semibold">Receiver Name:</span> {formData.receiver_name}</p>
                                                )}
                                                <p><span className="font-semibold">Receiver Number:</span> {formData.receiver_number}</p>
                                                <p><span className="font-semibold">Address Type:</span> {formData.address_type === 'home' ? 'Home' : formData.address_type === 'office' ? 'Office' : 'Other'}</p>
                                                <p><span className="font-semibold">Address:</span> {formData.address}</p>
                                                {formData.house_no && (
                                                    <p><span className="font-semibold">House No:</span> {formData.house_no}</p>
                                                )}
                                                {formData.floor_no && (
                                                    <p><span className="font-semibold">Floor No:</span> {formData.floor_no}</p>
                                                )}
                                                {formData.building_name && (
                                                    <p><span className="font-semibold">Building/Apartment:</span> {formData.building_name}</p>
                                                )}
                                                {formData.landmark && (
                                                    <p><span className="font-semibold">Landmark/Area:</span> {formData.landmark}</p>
                                                )}
                                                <p><span className="font-semibold">District:</span> {formData.district}</p>
                                                <p><span className="font-semibold">City:</span> {formData.city}, {formData.postal_code}</p>
                                                <p><span className="font-semibold">State:</span> {formData.state}</p>
                                                <p><span className="font-semibold">Country:</span> {formData.country}</p>
                                                {formData.notes && (
                                                    <p><span className="font-semibold">Notes:</span> {formData.notes}</p>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-between mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(1)}
                                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                                                >
                                                    ← Back to Shipping
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(3)}
                                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                                                >
                                                    Continue to Payment →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Payment Method */}
                                {currentStep === 3 && (
                                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                        <h2 className="text-xl font-bold mb-4">Step 3: Payment Method</h2>
                                        
                                        <div className="space-y-4">
                                            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                                                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Cash on Delivery</h3>
                                                        <p className="text-sm text-gray-600 mb-3">Pay when you receive your order</p>
                                                        <div className="bg-white rounded-md p-3 border border-indigo-200">
                                                            <p className="text-xs text-gray-500 mb-1 font-semibold">Payment Instructions:</p>
                                                            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                                                                <li>You will pay the delivery person when your order arrives</li>
                                                                <li>Please have exact change ready if possible</li>
                                                                <li>Your order will be processed immediately</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between mt-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(2)}
                                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                                                >
                                                    ← Back to Review
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                                    
                                    {/* Show coupon section only on step 1 and 2 */}
                                    {(currentStep === 1 || currentStep === 2) && (
                                    <div className="mb-4 pb-4 border-b">
                                        {!appliedCoupon ? (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Have a coupon code?
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={couponCode}
                                                        onChange={(e) => {
                                                            setCouponCode(e.target.value.toUpperCase());
                                                            setCouponError('');
                                                        }}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                                        placeholder="Enter code"
                                                        className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleApplyCoupon}
                                                        disabled={validatingCoupon || !couponCode.trim()}
                                                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {validatingCoupon ? '...' : 'Apply'}
                                                    </button>
                                                </div>
                                                {couponError && (
                                                    <p className="mt-1 text-sm text-red-600">{couponError}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-200 rounded-md p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <TicketIcon className="h-5 w-5 text-green-600 mr-2" />
                                                        <div>
                                                            <p className="text-sm font-semibold text-green-800">
                                                                {appliedCoupon.code}
                                                            </p>
                                                            <p className="text-xs text-green-600">
                                                                {appliedCoupon.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveCoupon}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    )}
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal ({items.length} items)</span>
                                            <span>${subtotal.toFixed(2)}</span>
                                        </div>
                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount ({appliedCoupon?.code})</span>
                                                <span>-${couponDiscount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600">
                                            <span>Tax</span>
                                            <span>${tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span>${shipping.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-4 mb-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span>${finalTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Method - Show only on step 3 */}
                                    {currentStep === 3 && (
                                        <div className="mb-4 pb-4 border-b">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">Cash on Delivery</p>
                                                        <p className="text-xs text-gray-500">Pay when you receive your order</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Place Order Button - Only show on step 3 */}
                                    {currentStep === 3 && (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing ? 'Processing...' : 'Place Order'}
                                        </Button>
                                    )}
                                    
                                    {/* Show step navigation message */}
                                    {currentStep < 3 && (
                                        <div className="text-center text-sm text-gray-500 mt-4">
                                            Complete all steps to place your order
                                        </div>
                                    )}
                                    
                                    <Link
                                        href="/cart"
                                        className="block text-center text-indigo-600 hover:text-indigo-800 font-semibold mt-4"
                                    >
                                        ← Back to Cart
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}

