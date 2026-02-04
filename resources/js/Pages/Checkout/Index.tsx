import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCartStore } from '../Cart/useCartStore';
import { useCheckoutStore } from './useCheckoutStore';
import { useCouponStore } from '../Products/useCouponStore';
import FormInput from '../../Components/FormInput/FormInput';
import FormTextarea from '../../Components/FormInput/FormTextarea';
import Button from '../../Components/Button';
import { XMarkIcon, TicketIcon } from '@heroicons/react/24/outline';

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
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
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
                    phone: user.phone || user.mobile || '',
                    address: user.address || '',
                    city: user.city || '',
                    postal_code: user.postal_code || '',
                    country: user.country || '',
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

        if (!formData.phone || formData.phone.trim() === '') {
            newErrors.phone = 'Phone number is required';
        }

        if (!formData.address || formData.address.trim() === '') {
            newErrors.address = 'Address is required';
        }

        if (!formData.city || formData.city.trim() === '') {
            newErrors.city = 'City is required';
        }

        if (!formData.postal_code || formData.postal_code.trim() === '') {
            newErrors.postal_code = 'Postal code is required';
        }

        if (!formData.country || formData.country.trim() === '') {
            newErrors.country = 'Country is required';
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
            alert('Your cart is empty');
            return;
        }

        try {
            setProcessing(true);
            setErrors({});

            const response = await useCheckoutStore.placeOrder({
                ...formData,
                use_cart: true,
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
            });

            if (response.data?.status && response.data?.data) {
                // Clear cart count
                window.dispatchEvent(new Event('cartUpdated'));
                
                // Redirect to order confirmation page
                router.visit(`/orders/${response.data.data.id}`, {
                    data: { order: response.data.data },
                });
            } else {
                alert(response.data?.message || 'Failed to place order');
            }
        } catch (error: any) {
            console.error('Error placing order:', error);
            
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert('Failed to place order. Please try again.');
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
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Checkout Form */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                    <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                                    
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

                                        <FormInput
                                            label="Phone Number"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            error={errors.phone}
                                            required
                                        />

                                        <FormInput
                                            label="Address"
                                            name="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            error={errors.address}
                                            required
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormInput
                                                label="City"
                                                name="city"
                                                type="text"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                error={errors.city}
                                                required
                                            />
                                            <FormInput
                                                label="Postal Code"
                                                name="postal_code"
                                                type="text"
                                                value={formData.postal_code}
                                                onChange={handleInputChange}
                                                error={errors.postal_code}
                                                required
                                            />
                                            <FormInput
                                                label="Country"
                                                name="country"
                                                type="text"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                error={errors.country}
                                                required
                                            />
                                        </div>

                                        <FormTextarea
                                            label="Order Notes (Optional)"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            error={errors.notes}
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Order Items Summary */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-xl font-bold mb-4">Order Items</h2>
                                    
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
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                                    <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                                    
                                    {/* Coupon Code Section */}
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
                                    
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        {processing ? 'Processing...' : 'Place Order'}
                                    </Button>
                                    
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

