import AppLayout from '../Layouts/AppLayout';
import Container from '../../Components/Container';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useRecentlyViewedStore } from '../Products/useRecentlyViewedStore';
import { useCartStore } from '../Cart/useCartStore';
import { getSessionId } from '../../utils/sessionStorage';
import Card from '../../Components/Card';
import Pagination from '../../Components/Pagination';

export default function RecentlyViewedIndex() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        fetchRecentlyViewed();
    }, [currentPage]);

    const fetchRecentlyViewed = async () => {
        try {
            setLoading(true);
            const sessionId = getSessionId();
            
            const requestData: any = { 
                per_page: 12,
                page: currentPage,
                session_id: sessionId || null
            };
            
            const response = await useRecentlyViewedStore.list(requestData);
            
            if (response.data?.status && response.data?.data) {
                // Products are in the 'data' field (Laravel pagination structure)
                const products = response.data.data.data || response.data.data.products || [];
                setRecentlyViewed(products);
                
                // Set pagination data (Laravel pagination structure)
                if (response.data.data.current_page !== undefined) {
                    setPagination({
                        current_page: response.data.data.current_page,
                        last_page: response.data.data.last_page,
                        per_page: response.data.data.per_page,
                        total: response.data.data.total,
                        from: response.data.data.from,
                        to: response.data.data.to,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching recently viewed products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (productId: number, change: number) => {
        setQuantities(prev => {
            const current = prev[productId] || 1;
            const newQuantity = Math.max(1, current + change);
            return { ...prev, [productId]: newQuantity };
        });
    };

    const handleAddToCart = async (e: React.MouseEvent, product: any) => {
        e.preventDefault();
        e.stopPropagation();
        
        const quantity = quantities[product.id] || 1;
        
        if (product.total_quantity !== null && product.total_quantity < quantity) {
            alert(`Only ${product.total_quantity} items available in stock`);
            return;
        }
        
        try {
            setAddingToCart(prev => ({ ...prev, [product.id]: true }));
            const response = await useCartStore.add({
                product_id: product.id,
                quantity: quantity,
            });
            
            if (response.data?.status) {
                window.dispatchEvent(new Event('openCart'));
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart');
        } finally {
            setAddingToCart(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const handleRemove = async (productId: number) => {
        try {
            const response = await useRecentlyViewedStore.remove({ product_id: productId });
            if (response.data?.status) {
                // Remove from local state
                setRecentlyViewed(prev => prev.filter(p => p.id !== productId));
            }
        } catch (error) {
            console.error('Error removing product:', error);
            alert('Failed to remove product');
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Are you sure you want to clear all recently viewed products?')) return;
        
        try {
            const response = await useRecentlyViewedStore.clear();
            if (response.data?.status) {
                setRecentlyViewed([]);
            }
        } catch (error) {
            console.error('Error clearing recently viewed:', error);
            alert('Failed to clear recently viewed products');
        }
    };

    const renderProductCard = (product: any) => {
        const primaryImage = product.media?.find((m: any) => m.is_primary) || product.media?.[0];
        const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
        const displayPrice = product.final_price || product.price;
        const mrp = product.mrp;
        const discount = product.discount_percent;
        
        const quantity = quantities[product.id] || 1;
        const isAdding = addingToCart[product.id] || false;
        
        return (
            <Card key={product.id} hover padding="none" className="overflow-hidden flex flex-col">
                <Link href={`/products/${product.id}`}>
                    <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                        {imageUrl ? (
                            <img src={imageUrl} alt={product.product_name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-gray-400">No Image</span>
                        )}
                        {discount > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                {discount}% OFF
                            </span>
                        )}
                    </div>
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1 hover:text-indigo-600">{product.product_name}</h3>
                        {product.brand && (
                            <p className="text-gray-500 text-xs mb-1">{product.brand}</p>
                        )}
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-indigo-600 font-bold">${displayPrice}</p>
                        {mrp && mrp > displayPrice && (
                            <p className="text-gray-400 line-through text-sm">${mrp}</p>
                        )}
                    </div>
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mb-3">
                        <label className="text-sm text-gray-700">Quantity:</label>
                        <div className="flex items-center border border-gray-300 rounded">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(product.id, -1);
                                }}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setQuantities(prev => ({ ...prev, [product.id]: Math.max(1, val) }));
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="w-16 px-2 py-1 text-center border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(product.id, 1);
                                }}
                                className="px-3 py-1 hover:bg-gray-100 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={isAdding || (product.total_quantity !== null && product.total_quantity === 0)}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                    >
                        {isAdding ? 'Adding...' : 'ADD TO CART'}
                    </button>
                    
                    {/* Remove Button */}
                    <button
                        onClick={() => handleRemove(product.id)}
                        className="w-full text-red-600 hover:text-red-800 text-sm font-semibold py-1"
                    >
                        Remove
                    </button>
                </div>
            </Card>
        );
    };

    return (
        <AppLayout>
            <Container className="py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Recently Viewed Products</h1>
                        <p className="text-gray-600 mt-2">Products you've recently viewed</p>
                    </div>
                    {recentlyViewed.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-red-600 hover:text-red-800 font-semibold"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading recently viewed products...</div>
                ) : recentlyViewed.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">You haven't viewed any products yet</p>
                        <Link
                            href="/products"
                            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recentlyViewed.map((item: any) => renderProductCard(item))}
                        </div>
                        
                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-8">
                                <Pagination 
                                    data={pagination} 
                                    baseUrl="/recently-viewed"
                                />
                            </div>
                        )}
                    </>
                )}
            </Container>
        </AppLayout>
    );
}

