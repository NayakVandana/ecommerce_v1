import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCartStore } from './useCartStore';
import toast from '../../utils/toast';
import ConfirmationModal from '../../Components/ConfirmationModal';
import CartSkeleton from '../../Components/Skeleton/CartSkeleton';
import { EyeIcon } from '@heroicons/react/24/outline';
import { isAuthenticated } from '../../utils/sessionStorage';

export default function Index() {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);
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
            toast({ type: 'error', message: 'Failed to update cart' });
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
            toast({ type: 'error', message: 'Failed to remove item' });
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
            toast({ type: 'error', message: 'Failed to clear cart' });
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <CartSkeleton />
            </AppLayout>
        );
    }

    const items = cart?.items || [];
    const total = cart?.total || 0;

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12 text-center">
                        <p className="text-gray-500 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">Your cart is empty</p>
                        <Link
                            href="/categories"
                            className="inline-block bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Cart Items */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const variation = item.variation;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    
                                    return (
                                        <div key={item.id} className="border-b last:border-b-0 p-3 sm:p-4 lg:p-6">
                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                                                <div className="flex-shrink-0 relative group flex justify-center sm:justify-start">
                                                    <Link href={`/products/${product?.id}`}>
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-200 rounded overflow-hidden relative">
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
                                                                <EyeIcon className="h-4 w-4 sm:h-5 sm:w-6 text-white" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/products/${product?.id}`}>
                                                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 hover:text-indigo-600 break-words line-clamp-2">
                                                            {product?.product_name}
                                                        </h3>
                                                    </Link>
                                                    {product?.brand && (
                                                        <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Brand: {product.brand}</p>
                                                    )}
                                                    {variation && (
                                                        <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                                                            {variation.size && `Size: ${variation.size} `}
                                                            {variation.color && `Color: ${variation.color}`}
                                                        </p>
                                                    )}
                                                    
                                                    {/* Pricing Details */}
                                                    {(() => {
                                                        const mrp = parseFloat(product?.mrp || product?.price || 0);
                                                        const finalPrice = parseFloat(product?.final_price || product?.price || 0);
                                                        const discountPercent = parseFloat(product?.discount_percent || 0);
                                                        const hasDiscount = discountPercent > 0 && mrp > finalPrice;
                                                        const itemMrpTotal = mrp * item.quantity;
                                                        const itemSavings = itemMrpTotal - (item.subtotal || 0);
                                                        
                                                        return (
                                                            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1">
                                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                                    {hasDiscount && (
                                                                        <>
                                                                            <span className="text-xs sm:text-sm text-gray-400 line-through">
                                                                                ₹{mrp.toFixed(2)}
                                                                            </span>
                                                                            <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                                                                                {discountPercent.toFixed(0)}% OFF
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    <span className={`text-xs sm:text-sm font-semibold ${hasDiscount ? 'text-indigo-600' : 'text-gray-700'}`}>
                                                                        ₹{finalPrice.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-[10px] sm:text-xs text-gray-500">per item</span>
                                                                </div>
                                                                {hasDiscount && itemSavings > 0 && (
                                                                    <p className="text-[10px] sm:text-xs text-green-600 font-medium">
                                                                        You save ₹{itemSavings.toFixed(2)} on this item
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-3 sm:mt-4">
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                                                disabled={updating === item.id || item.quantity <= 1}
                                                                className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-10 sm:w-12 text-center text-xs sm:text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                                                disabled={updating === item.id}
                                                                className="px-2 sm:px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3 sm:gap-4 flex-1 sm:flex-initial sm:justify-end">
                                                            <div className="text-right">
                                                                {(() => {
                                                                    const mrp = parseFloat(product?.mrp || product?.price || 0);
                                                                    const discountPercent = parseFloat(product?.discount_percent || 0);
                                                                    const finalPrice = parseFloat(product?.final_price || product?.price || 0);
                                                                    const hasDiscount = discountPercent > 0 && mrp > finalPrice;
                                                                    const itemMrpTotal = mrp * item.quantity;
                                                                    
                                                                    return (
                                                                        <>
                                                                            {hasDiscount && (
                                                                                <p className="text-[10px] sm:text-xs text-gray-400 line-through mb-0.5 sm:mb-1">
                                                                                    ₹{itemMrpTotal.toFixed(2)}
                                                                                </p>
                                                                            )}
                                                                            <p className="font-bold text-sm sm:text-base text-indigo-600">
                                                                                ₹{(item.subtotal || 0).toFixed(2)}
                                                                            </p>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            
                                                            <button
                                                                onClick={() => removeItem(item)}
                                                                disabled={updating === item.id}
                                                                className="text-xs sm:text-sm text-red-600 hover:text-red-800 disabled:opacity-50 whitespace-nowrap"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                                <button
                                    onClick={clearCart}
                                    className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-semibold text-left sm:text-left"
                                >
                                    Clear Cart
                                </button>
                                <Link
                                    href="/categories"
                                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold text-left sm:text-right"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 lg:p-6 sticky top-4">
                                <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Order Summary</h2>
                                
                                {(() => {
                                    const totalMrp = items.reduce((sum: number, item: any) => {
                                        const product = item.product;
                                        const mrp = parseFloat(product?.mrp || product?.price || 0);
                                        return sum + (mrp * item.quantity);
                                    }, 0);
                                    const totalSavings = totalMrp - total;
                                    const hasAnyDiscount = items.some((item: any) => {
                                        const product = item.product;
                                        const discountPercent = parseFloat(product?.discount_percent || 0);
                                        const mrp = parseFloat(product?.mrp || product?.price || 0);
                                        const finalPrice = parseFloat(product?.final_price || product?.price || 0);
                                        return discountPercent > 0 && mrp > finalPrice;
                                    });
                                    
                                    return (
                                        <>
                                            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                                {hasAnyDiscount && totalMrp > total && (
                                                    <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                                                        <span>Total MRP</span>
                                                        <span className="line-through">₹{totalMrp.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                                                    <span>Subtotal ({items.length} items)</span>
                                                    <span>₹{total.toFixed(2)}</span>
                                                </div>
                                                {hasAnyDiscount && totalSavings > 0 && (
                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                        <span className="text-green-600 font-medium">Total Savings</span>
                                                        <span className="text-green-600 font-semibold">-₹{totalSavings.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                                                    <span>Shipping</span>
                                                    <span className="text-[10px] sm:text-xs">Calculated at checkout</span>
                                                </div>
                                            </div>
                                            
                                            {hasAnyDiscount && totalSavings > 0 && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-[10px] sm:text-xs font-semibold text-green-800">You're saving</span>
                                                        </div>
                                                        <span className="text-sm sm:text-base font-bold text-green-600">
                                                            ₹{totalSavings.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] sm:text-xs text-green-700 mt-1">
                                                        {((totalSavings / totalMrp) * 100).toFixed(1)}% off on your order!
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="border-t pt-3 sm:pt-4 mb-3 sm:mb-4">
                                                <div className="flex justify-between text-base sm:text-lg font-bold">
                                                    <span>Total</span>
                                                    <span>₹{total.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                                
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
                                    className="block w-full bg-indigo-600 text-white text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
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

