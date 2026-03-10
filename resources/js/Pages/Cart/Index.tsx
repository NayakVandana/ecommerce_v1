import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCartStore } from './useCartStore';
import toast from '../../utils/toast';
import ConfirmationModal from '../../Components/ConfirmationModal';
import CartSkeleton from '../../Components/Skeleton/CartSkeleton';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 text-gray-900">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6">Your cart is empty</p>
                            <Link
                                href="/categories"
                                className="inline-block bg-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const variation = item.variation;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    
                                    return (
                                        <div key={item.id} className="border-b border-gray-200 last:border-b-0 p-4 sm:p-5 lg:p-6">
                                            <div className="flex gap-3 sm:gap-4 lg:gap-6">
                                                {/* Product Image */}
                                                <div className="flex-shrink-0 relative group">
                                                    <Link href={`/products/${product?.id}`} className="block">
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-200">
                                                            {imageUrl ? (
                                                                <img 
                                                                    src={imageUrl} 
                                                                    alt={product?.product_name} 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                                    <span className="text-gray-400 text-xs">No Image</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <EyeIcon className="h-5 w-5 text-white" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                                
                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0 flex flex-col">
                                                    <Link href={`/products/${product?.id}`}>
                                                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1.5 hover:text-indigo-600 transition-colors line-clamp-2">
                                                            {product?.product_name}
                                                        </h3>
                                                    </Link>
                                                    
                                                    <div className="space-y-1 mb-2 sm:mb-3">
                                                        {product?.brand && (
                                                            <p className="text-xs sm:text-sm text-gray-600">Brand: <span className="font-medium">{product.brand}</span></p>
                                                        )}
                                                        {variation && (
                                                            <p className="text-xs sm:text-sm text-gray-600">
                                                                {variation.size && <span>Size: <span className="font-medium">{variation.size}</span></span>}
                                                                {variation.size && variation.color && <span className="mx-1">•</span>}
                                                                {variation.color && <span>Color: <span className="font-medium">{variation.color}</span></span>}
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Pricing Details */}
                                                    {(() => {
                                                        const mrp = parseFloat(product?.mrp || product?.price || 0);
                                                        const finalPrice = parseFloat(product?.final_price || product?.price || 0);
                                                        const discountPercent = parseFloat(product?.discount_percent || 0);
                                                        const hasDiscount = discountPercent > 0 && mrp > finalPrice;
                                                        const itemMrpTotal = mrp * item.quantity;
                                                        const itemSavings = itemMrpTotal - (item.subtotal || 0);
                                                        
                                                        return (
                                                            <div className="mb-3 sm:mb-4 space-y-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {hasDiscount && (
                                                                        <>
                                                                            <span className="text-xs sm:text-sm text-gray-400 line-through">
                                                                                ₹{mrp.toFixed(2)}
                                                                            </span>
                                                                            <span className="text-[10px] sm:text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                                                                {discountPercent.toFixed(0)}% OFF
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    <span className={`text-sm sm:text-base font-semibold ${hasDiscount ? 'text-indigo-600' : 'text-gray-900'}`}>
                                                                        ₹{finalPrice.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">per item</span>
                                                                </div>
                                                                {hasDiscount && itemSavings > 0 && (
                                                                    <p className="text-xs text-green-600 font-medium">
                                                                        You save ₹{itemSavings.toFixed(2)} on this item
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    {/* Quantity Controls and Actions */}
                                                    <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-gray-100">
                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs sm:text-sm text-gray-600 font-medium mr-1">Qty:</span>
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                                                disabled={updating === item.id || item.quantity <= 1}
                                                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-gray-300 rounded-md text-base sm:text-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 transition-colors"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="w-10 sm:w-12 text-center text-sm sm:text-base font-semibold">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                                                disabled={updating === item.id}
                                                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-gray-300 rounded-md text-base sm:text-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100 transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Price and Remove */}
                                                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                                            <div className="text-right sm:text-left">
                                                                {(() => {
                                                                    const mrp = parseFloat(product?.mrp || product?.price || 0);
                                                                    const discountPercent = parseFloat(product?.discount_percent || 0);
                                                                    const finalPrice = parseFloat(product?.final_price || product?.price || 0);
                                                                    const hasDiscount = discountPercent > 0 && mrp > finalPrice;
                                                                    const itemMrpTotal = mrp * item.quantity;
                                                                    
                                                                    return (
                                                                        <>
                                                                            {hasDiscount && (
                                                                                <p className="text-xs text-gray-400 line-through mb-0.5">
                                                                                    ₹{itemMrpTotal.toFixed(2)}
                                                                                </p>
                                                                            )}
                                                                            <p className="font-bold text-base sm:text-lg text-indigo-600">
                                                                                ₹{(item.subtotal || 0).toFixed(2)}
                                                                            </p>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            
                                                            <button
                                                                onClick={() => removeItem(item)}
                                                                disabled={updating === item.id}
                                                                className="flex items-center gap-1.5 text-sm sm:text-base text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1.5 sm:p-2 -mr-1.5 sm:-mr-2"
                                                                title="Remove item"
                                                            >
                                                                <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                <span className="hidden sm:inline">Remove</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
                                <button
                                    onClick={clearCart}
                                    className="text-sm sm:text-base text-red-600 hover:text-red-700 font-semibold text-left sm:text-left transition-colors py-2"
                                >
                                    Clear Cart
                                </button>
                                <Link
                                    href="/categories"
                                    className="text-sm sm:text-base text-indigo-600 hover:text-indigo-700 font-semibold text-left sm:text-right transition-colors py-2"
                                >
                                    Continue Shopping →
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary - Sticky on mobile */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6 lg:sticky lg:top-4">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-5 text-gray-900">Order Summary</h2>
                                
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
                                            <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                                                {hasAnyDiscount && totalMrp > total && (
                                                    <div className="flex justify-between text-sm text-gray-600 pb-2 border-b border-gray-100">
                                                        <span>Total MRP</span>
                                                        <span className="line-through">₹{totalMrp.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm sm:text-base text-gray-700">
                                                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                                                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                                                </div>
                                                {hasAnyDiscount && totalSavings > 0 && (
                                                    <div className="flex justify-between text-sm sm:text-base">
                                                        <span className="text-green-600 font-medium">Total Savings</span>
                                                        <span className="text-green-600 font-semibold">-₹{totalSavings.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm sm:text-base text-gray-600 pt-2 border-t border-gray-100">
                                                    <span>Shipping</span>
                                                    <span className="text-xs sm:text-sm text-gray-500">Calculated at checkout</span>
                                                </div>
                                            </div>
                                            
                                            {hasAnyDiscount && totalSavings > 0 && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-xs sm:text-sm font-semibold text-green-800">You're saving</span>
                                                        </div>
                                                        <span className="text-base sm:text-lg font-bold text-green-600">
                                                            ₹{totalSavings.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-green-700">
                                                        {((totalSavings / totalMrp) * 100).toFixed(1)}% off on your order!
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="border-t border-gray-200 pt-4 sm:pt-5 mb-4 sm:mb-5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Total</span>
                                                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">₹{total.toFixed(2)}</span>
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
                                    className="block w-full bg-indigo-600 text-white text-center px-6 py-3.5 sm:py-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-md"
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
