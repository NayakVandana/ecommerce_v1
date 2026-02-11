import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useWishlistStore } from './useWishlistStore';
import { useCartStore } from '../Cart/useCartStore';
import AlertModal from '../../Components/AlertModal';
import ConfirmationModal from '../../Components/ConfirmationModal';
import { HeartIcon, TrashIcon, ShoppingCartIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function Index() {
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<number | null>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const response = await useWishlistStore.list();
            if (response.data?.status && response.data?.data) {
                setWishlist(response.data.data.items || []);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = (productId: number) => {
        setConfirmMessage('Are you sure you want to remove this item from your wishlist?');
        setConfirmAction(() => async () => {
            try {
                setRemoving(productId);
                const response = await useWishlistStore.remove({ product_id: productId });
                
                if (response.data?.status) {
                    setAlertMessage('Item removed from wishlist');
                    setAlertType('success');
                    setShowAlert(true);
                    await fetchWishlist();
                    // Dispatch event to update wishlist count in header
                    window.dispatchEvent(new Event('wishlistUpdated'));
                } else {
                    setAlertMessage(response.data?.message || 'Failed to remove item');
                    setAlertType('error');
                    setShowAlert(true);
                }
            } catch (error: any) {
                console.error('Error removing from wishlist:', error);
                setAlertMessage(error.response?.data?.message || 'Failed to remove item');
                setAlertType('error');
                setShowAlert(true);
            } finally {
                setRemoving(null);
                setShowConfirm(false);
            }
        });
        setShowConfirm(true);
    };

    const handleAddToCart = async (product: any) => {
        try {
            setAddingToCart(product.product_id);
            const response = await useCartStore.add({
                product_id: product.product_id,
                quantity: 1,
            });
            
            if (response.data?.status) {
                setAlertMessage('Product added to cart');
                setAlertType('success');
                setShowAlert(true);
                // Dispatch event to update cart count in header
                window.dispatchEvent(new Event('cartUpdated'));
            } else {
                setAlertMessage(response.data?.message || 'Failed to add to cart');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to add to cart');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setAddingToCart(null);
        }
    };

    const handleClearWishlist = () => {
        setConfirmMessage('Are you sure you want to clear your entire wishlist?');
        setConfirmAction(() => async () => {
            try {
                const response = await useWishlistStore.clear();
                
                if (response.data?.status) {
                    setAlertMessage('Wishlist cleared');
                    setAlertType('success');
                    setShowAlert(true);
                    await fetchWishlist();
                    window.dispatchEvent(new Event('wishlistUpdated'));
                } else {
                    setAlertMessage(response.data?.message || 'Failed to clear wishlist');
                    setAlertType('error');
                    setShowAlert(true);
                }
            } catch (error: any) {
                console.error('Error clearing wishlist:', error);
                setAlertMessage(error.response?.data?.message || 'Failed to clear wishlist');
                setAlertType('error');
                setShowAlert(true);
            } finally {
                setShowConfirm(false);
            }
        });
        setShowConfirm(true);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                    {wishlist.length > 0 && (
                        <button
                            onClick={handleClearWishlist}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Clear Wishlist
                        </button>
                    )}
                </div>

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-500 mb-6">Start adding products you love to your wishlist!</p>
                        <Link
                            href="/products"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {wishlist.map((item: any) => {
                            const price = item.sale_price || item.price;
                            const originalPrice = item.sale_price ? item.price : null;
                            const discount = item.sale_price ? Math.round(((item.price - item.sale_price) / item.price) * 100) : 0;

                            return (
                                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative">
                                        <Link href={`/products/${item.slug || item.product_id}`}>
                                            <div className="aspect-square bg-gray-200 relative overflow-hidden">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.product_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        No Image
                                                    </div>
                                                )}
                                                {discount > 0 && (
                                                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                                        -{discount}%
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                        <button
                                            onClick={() => handleRemove(item.product_id)}
                                            disabled={removing === item.product_id}
                                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
                                            title="Remove from wishlist"
                                        >
                                            {removing === item.product_id ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                            ) : (
                                                <HeartIconSolid className="h-5 w-5 text-red-600" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="p-4">
                                        <Link href={`/products/${item.slug || item.product_id}`}>
                                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
                                                {item.product_name}
                                            </h3>
                                        </Link>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg font-bold text-gray-900">₹{Number(price).toFixed(2)}</span>
                                            {originalPrice && (
                                                <span className="text-sm text-gray-500 line-through">₹{Number(originalPrice).toFixed(2)}</span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                disabled={addingToCart === item.product_id || !item.in_stock}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                            >
                                                {addingToCart === item.product_id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCartIcon className="h-4 w-4" />
                                                        Add to Cart
                                                    </>
                                                )}
                                            </button>
                                            <Link
                                                href={`/products/${item.slug || item.product_id}`}
                                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                title="View Details"
                                            >
                                                <EyeIcon className="h-5 w-5 text-gray-600" />
                                            </Link>
                                        </div>

                                        {!item.in_stock && (
                                            <p className="text-xs text-red-600 mt-2">Out of Stock</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    message={alertMessage}
                    type={alertType}
                />

                <ConfirmationModal
                    isOpen={showConfirm}
                    onClose={() => setShowConfirm(false)}
                    onConfirm={confirmAction || (() => {})}
                    message={confirmMessage}
                    title="Confirm Action"
                />
            </div>
        </AppLayout>
    );
}

