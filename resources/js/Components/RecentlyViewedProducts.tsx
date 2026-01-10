import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useRecentlyViewedStore } from '@/Pages/Products/useRecentlyViewedStore';
import { useCartStore } from '@/Pages/Cart/useCartStore';
import { getSessionId } from '@/utils/sessionStorage';
import Card from './Card';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function RecentlyViewedProducts({ 
    limit = 4, 
    title = "Recently Viewed Products",
    showQuantity = true,
    showMoreLink = false
}: any) {
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        fetchRecentlyViewed();
    }, [limit]);

    const fetchRecentlyViewed = async () => {
        try {
            setLoading(true);
            // Get session_id from localStorage
            // For authenticated users: backend uses user_id from token (ignores session_id)
            // For guest users: backend uses session_id
            const sessionId = getSessionId();
            
            // Use pagination instead of limit
            // Backend will:
            // - For authenticated users: use user_id from Authorization token (ignores session_id)
            // - For guest users: use session_id to fetch recently viewed products
            // Always send session_id (even if null) so backend can create/return one for guests
            const requestData: any = { 
                per_page: limit,
                page: 1,
                session_id: sessionId || null
            };
            
            const response = await useRecentlyViewedStore.list(requestData);
            
            if (response.data?.status && response.data?.data) {
                // Products are in the 'data' field (Laravel pagination structure)
                const products = response.data.data.data || response.data.data.products || [];
                setRecentlyViewed(products);
                
                // Set total count from pagination
                if (response.data.data.total !== undefined) {
                    setTotalCount(response.data.data.total);
                } else if (response.data.data.count !== undefined) {
                    setTotalCount(response.data.data.count);
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
        
        // Check stock availability
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
                // Open cart sidebar
                window.dispatchEvent(new Event('openCart'));
                // Update cart count in navigation
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart');
        } finally {
            setAddingToCart(prev => ({ ...prev, [product.id]: false }));
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
                    <div className="h-48 bg-gray-200 flex items-center justify-center relative group">
                        {imageUrl ? (
                            <img src={imageUrl} alt={product.product_name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-gray-400">No Image</span>
                        )}
                        {discount > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold z-10">
                                {discount}% OFF
                            </span>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <EyeIcon className="h-8 w-8 text-white" />
                        </div>
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
                    
                    {showQuantity && (
                        <>
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
                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAdding ? 'Adding...' : 'ADD TO CART'}
                            </button>
                        </>
                    )}
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">{title}</h2>
                <div className="text-center py-12 text-gray-500">Loading recently viewed products...</div>
            </div>
        );
    }

    if (recentlyViewed.length === 0) {
        return null; // Don't show section if no recently viewed products
    }

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{title}</h2>
                {showMoreLink && totalCount > limit && (
                    <Link
                        href="/recently-viewed"
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                        Show More ({totalCount - limit} more)
                    </Link>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewed.map((item: any) => renderProductCard(item))}
            </div>
        </div>
    );
}

