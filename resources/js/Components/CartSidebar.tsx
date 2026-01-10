import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/Pages/Cart/useCartStore';

export default function CartSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [cart, setCart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
    }, [isOpen]);

    // Listen for cart updates
    useEffect(() => {
        const handleCartUpdate = () => {
            if (isOpen) {
                fetchCart();
            }
        };
        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, [isOpen]);

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
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error updating cart:', error);
            alert('Failed to update cart');
        } finally {
            setUpdating(null);
        }
    };

    const removeItem = async (item: any) => {
        try {
            setUpdating(item.id);
            const response = await useCartStore.remove({
                product_id: item.product?.id,
                variation_id: item.variation?.id,
            });
            
            if (response.data?.status) {
                await fetchCart();
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error removing item:', error);
            alert('Failed to remove item');
        } finally {
            setUpdating(null);
        }
    };

    const items = cart?.items || [];
    const total = cart?.total || 0;
    const totalMrp = items.reduce((sum: number, item: any) => {
        const product = item.product;
        const mrp = product?.mrp || product?.price || 0;
        return sum + (mrp * item.quantity);
    }, 0);
    const savings = totalMrp - total;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-xl font-bold">Shopping Cart</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Cart Content */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading cart...</div>
                        ) : items.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 mb-4">Your cart is empty</p>
                                <button
                                    onClick={onClose}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {items.map((item: any) => {
                                    const product = item.product;
                                    const variation = item.variation;
                                    const primaryImage = product?.media?.find((m: any) => m.is_primary) || product?.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    
                                    return (
                                        <div key={item.id} className="border-b pb-4 last:border-b-0">
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 relative group">
                                                    <Link
                                                        href={`/products/${product?.id}`}
                                                        onClick={onClose}
                                                    >
                                                        <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden relative">
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
                                                                <EyeIcon className="h-5 w-5 text-white" />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        href={`/products/${product?.id}`}
                                                        onClick={onClose}
                                                        className="block"
                                                    >
                                                        <h3 className="font-semibold text-sm mb-1 hover:text-indigo-600 line-clamp-2">
                                                            {product?.product_name}
                                                        </h3>
                                                    </Link>
                                                    {variation && (
                                                        <p className="text-xs text-gray-500 mb-1">
                                                            {variation.size && `${variation.size} `}
                                                            {variation.color && `${variation.color}`}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                                                disabled={updating === item.id || item.quantity <= 1}
                                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                                                disabled={updating === item.id}
                                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        
                                                        <div className="text-right">
                                                            <p className="font-bold text-indigo-600 text-sm">
                                                                ${(item.subtotal || 0).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={() => removeItem(item)}
                                                        disabled={updating === item.id}
                                                        className="text-red-600 hover:text-red-800 text-xs mt-2 disabled:opacity-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer with Summary */}
                    {!loading && items.length > 0 && (
                        <div className="border-t p-4 bg-gray-50">
                            <div className="space-y-2 mb-4">
                                {totalMrp > total && (
                                    <>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>TOTAL MRP</span>
                                            <span>${totalMrp.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>SAVINGS ON MRP</span>
                                            <span>-${savings.toFixed(2)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                    <span>SUBTOTAL</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="block w-full bg-indigo-600 text-white text-center px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition mb-2"
                            >
                                View Cart
                            </Link>
                            <Link
                                href="/checkout"
                                onClick={onClose}
                                className="block w-full bg-gray-800 text-white text-center px-4 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
                            >
                                Checkout
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

