import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCartStore } from './useCartStore';
import AlertModal from '../../Components/AlertModal';
import ConfirmationModal from '../../Components/ConfirmationModal';
import { EyeIcon } from '@heroicons/react/24/outline';
import { isAuthenticated } from '../../utils/sessionStorage';

export default function Index() {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [showLoginConfirm, setShowLoginConfirm] = useState(false);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await useCartStore.list();
            if (response.data?.status && response.data?.data) {
                setCart(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (item: any, quantity: number) => {
        if (quantity < 1) return;
        
        try {
            setUpdating(item.id);
            const response = await useCartStore.update({
                product_id: item.product?.id,
                variation_id: item.variation?.id,
                quantity: quantity,
            });
            
            if (response.data?.status) {
                await fetchCart();
                // Dispatch event to update cart count in navigation
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            setAlertMessage('Failed to update cart');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (item: any) => {
        setConfirmMessage('Are you sure you want to remove this item from cart?');
        setConfirmAction(() => () => handleRemoveConfirm(item));
        setShowConfirm(true);
    };

    const handleRemoveConfirm = async (item: any) => {
        setShowConfirm(false);
        try {
            setUpdating(item.id);
            const response = await useCartStore.remove({
                product_id: item.product?.id,
                variation_id: item.variation?.id,
            });
            
            if (response.data?.status) {
                await fetchCart();
                // Dispatch event to update cart count in navigation
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error removing item:', error);
            setAlertMessage('Failed to remove item');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setUpdating(null);
        }
    };

    const clearCart = async () => {
        setConfirmMessage('Are you sure you want to clear your cart?');
        setConfirmAction(() => () => handleClearConfirm());
        setShowConfirm(true);
    };

    const handleClearConfirm = async () => {
        setShowConfirm(false);
        try {
            const response = await useCartStore.clear();
            if (response.data?.status) {
                setCart({ items: [], total: 0 });
                // Dispatch event to update cart count in navigation
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            setAlertMessage('Failed to clear cart');
            setAlertType('error');
            setShowAlert(true);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading cart...</p>
                </div>
            </AppLayout>
        );
    }

    const items = cart?.items || [];
    const total = cart?.total || 0;

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
                        <Link
                            href="/products"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const variation = item.variation;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    
                                    return (
                                        <div key={item.id} className="border-b last:border-b-0 p-6">
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 relative group">
                                                    <Link href={`/products/${product?.id}`}>
                                                        <div className="w-24 h-24 bg-gray-200 rounded overflow-hidden relative">
                                                            {imageUrl ? (
                                                                <img 
                                                                    src={imageUrl} 
                                                                    alt={product?.product_name} 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 text-xs flex items-center justify-center h-full">No Image</span>
                                                            )}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <EyeIcon className="h-6 w-6 text-white" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <Link href={`/products/${product?.id}`}>
                                                        <h3 className="font-semibold text-lg mb-1 hover:text-indigo-600">
                                                            {product?.product_name}
                                                        </h3>
                                                    </Link>
                                                    {product?.brand && (
                                                        <p className="text-sm text-gray-500 mb-1">Brand: {product.brand}</p>
                                                    )}
                                                    {variation && (
                                                        <p className="text-sm text-gray-500 mb-1">
                                                            {variation.size && `Size: ${variation.size} `}
                                                            {variation.color && `Color: ${variation.color}`}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                                                disabled={updating === item.id || item.quantity <= 1}
                                                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-12 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                                                disabled={updating === item.id}
                                                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <p className="font-bold text-indigo-600">
                                                                ${(item.subtotal || 0).toFixed(2)}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                ${((item.subtotal || 0) / item.quantity).toFixed(2)} each
                                                            </p>
                                                        </div>
                                                        
                                                        <button
                                                            onClick={() => removeItem(item)}
                                                            disabled={updating === item.id}
                                                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-4 flex justify-between">
                                <button
                                    onClick={clearCart}
                                    className="text-red-600 hover:text-red-800 font-semibold"
                                >
                                    Clear Cart
                                </button>
                                <Link
                                    href="/products"
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal ({items.length} items)</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Shipping</span>
                                        <span>Calculated at checkout</span>
                                    </div>
                                </div>
                                
                                <div className="border-t pt-4 mb-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        if (!isAuthenticated()) {
                                            setConfirmMessage('You need to login to proceed to checkout. Would you like to login now?');
                                            setConfirmAction(() => () => {
                                                setShowLoginConfirm(false);
                                                router.visit('/login');
                                            });
                                            setShowLoginConfirm(true);
                                        } else {
                                            router.visit('/checkout');
                                        }
                                    }}
                                    className="block w-full bg-indigo-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                message={alertMessage}
                type={alertType}
            />
            
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => {
                    setShowConfirm(false);
                    setConfirmAction(null);
                }}
                onConfirm={() => {
                    if (confirmAction) {
                        confirmAction();
                        setConfirmAction(null);
                    }
                }}
                title="Confirm Action"
                message={confirmMessage}
                confirmText="Confirm"
                cancelText="Cancel"
                confirmButtonColor="red"
            />
            
            <ConfirmationModal
                isOpen={showLoginConfirm}
                onClose={() => {
                    setShowLoginConfirm(false);
                    setConfirmAction(null);
                }}
                onConfirm={() => {
                    if (confirmAction) {
                        confirmAction();
                        setConfirmAction(null);
                    }
                }}
                title="Login Required"
                message={confirmMessage}
                confirmText="Login"
                cancelText="Cancel"
                confirmButtonColor="indigo"
            />
        </AppLayout>
    );
}

