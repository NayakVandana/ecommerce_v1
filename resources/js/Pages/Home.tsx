import AppLayout from './Layouts/AppLayout';
import Container from '../Components/Container';
import Card from '../Components/Card';
import Button from '../Components/Button';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useProductStore } from './Products/useProductStore';
import { useCategoryStore } from './Categories/useCategoryStore';
import { useCartStore } from './Cart/useCartStore';
import { useWishlistStore } from './Wishlist/useWishlistStore';
import toast from '../utils/toast';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import RecentlyViewedProducts from '../Components/RecentlyViewedProducts';
import Pagination from '../Components/Pagination';
import CategoryIcon from '../Components/CategoryIcon';
import CategoryModal from '../Components/CategoryModal';

export default function Home() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [products, setProducts] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});
    const [wishlistStatus, setWishlistStatus] = useState<{ [key: number]: boolean }>({});
    const [togglingWishlist, setTogglingWishlist] = useState<{ [key: number]: boolean }>({});
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<any>(null);
    const [allCategoriesForModal, setAllCategoriesForModal] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    useEffect(() => {
        // Check wishlist status for all products
        if (products.length > 0) {
            products.forEach((product: any) => {
                checkWishlistStatus(product.id);
            });
        }
    }, [products]);

    const checkWishlistStatus = async (productId: number) => {
        try {
            const response = await useWishlistStore.check({ product_id: productId });
            if (response.data?.status) {
                setWishlistStatus(prev => ({
                    ...prev,
                    [productId]: response.data.data?.in_wishlist || false
                }));
            }
        } catch (error) {
            console.error('Error checking wishlist status:', error);
        }
    };

    const handleToggleWishlist = async (e: React.MouseEvent, productId: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            setTogglingWishlist(prev => ({ ...prev, [productId]: true }));
            const isInWishlist = wishlistStatus[productId];
            
            if (isInWishlist) {
                const response = await useWishlistStore.remove({ product_id: productId });
                if (response.data?.status) {
                    setWishlistStatus(prev => ({ ...prev, [productId]: false }));
                    toast({ type: 'success', message: 'Removed from wishlist' });
                    window.dispatchEvent(new Event('wishlistUpdated'));
                }
            } else {
                const response = await useWishlistStore.add({ product_id: productId });
                if (response.data?.status) {
                    setWishlistStatus(prev => ({ ...prev, [productId]: true }));
                    toast({ type: 'success', message: 'Added to wishlist' });
                    window.dispatchEvent(new Event('wishlistUpdated'));
                }
            }
        } catch (error: any) {
            console.error('Error toggling wishlist:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to update wishlist' });
        } finally {
            setTogglingWishlist(prev => ({ ...prev, [productId]: false }));
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
            toast({ type: 'warning', message: `Only ${product.total_quantity} items available in stock` });
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
            toast({ type: 'error', message: 'Failed to add product to cart' });
        } finally {
            setAddingToCart(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const handleCategoryClick = (e: React.MouseEvent, category: any) => {
        e.preventDefault();
        setSelectedCategoryForModal(category);
        setShowCategoryModal(true);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes, allCategoriesRes] = await Promise.all([
                useProductStore.list({ page: currentPage, per_page: 8 }),
                useCategoryStore.home(), // Use home API for minimal data (parent categories only)
                useCategoryStore.list(), // Fetch all categories with hierarchy for modal
            ]);

            if (productsRes.data?.status && productsRes.data?.data) {
                setProducts(productsRes.data.data.data || []);
                setPagination(productsRes.data.data);
            }

            if (categoriesRes.data?.status && categoriesRes.data?.data) {
                // Home API returns array directly (only main categories with minimal fields)
                let categoriesArray = [];
                if (Array.isArray(categoriesRes.data.data)) {
                    categoriesArray = categoriesRes.data.data;
                }
                
                if (categoriesArray.length > 0) {
                    // Show all categories, not just featured
                    setFeaturedCategories(categoriesArray);
                }
            }

            // Store all categories with hierarchy for modal use
            if (allCategoriesRes.data?.status && allCategoriesRes.data?.data) {
                const categoriesData = allCategoriesRes.data.data;
                if (categoriesData.hierarchical && Array.isArray(categoriesData.hierarchical) && categoriesData.hierarchical.length > 0) {
                    setAllCategoriesForModal(categoriesData.hierarchical);
                } else if (categoriesData.flat && Array.isArray(categoriesData.flat) && categoriesData.flat.length > 0) {
                    setAllCategoriesForModal(categoriesData.flat);
                }
            }
        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to render product card
    const renderProductCard = (product: any) => {
        const primaryImage = product.media?.find((m: any) => m.is_primary) || product.media?.[0];
        const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
        const displayPrice = product.final_price || product.price;
        const mrp = product.mrp;
        const discount = product.discount_percent;
        
        const quantity = quantities[product.id] || 1;
        const isAdding = addingToCart[product.id] || false;
        const isInWishlist = wishlistStatus[product.id] || false;
        const isToggling = togglingWishlist[product.id] || false;
        
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
                        <button
                            onClick={(e) => handleToggleWishlist(e, product.id)}
                            disabled={isToggling}
                            className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors disabled:opacity-50 z-10"
                            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            {isToggling ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                            ) : isInWishlist ? (
                                <HeartIconSolid className="h-5 w-5 text-red-600" />
                            ) : (
                                <HeartIcon className="h-5 w-5 text-gray-600" />
                            )}
                        </button>
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
                        <p className="text-indigo-600 font-bold">₹{displayPrice}</p>
                        {mrp && mrp > displayPrice && (
                            <p className="text-gray-400 line-through text-sm">₹{mrp}</p>
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
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isAdding || (product.total_quantity !== null && product.total_quantity === 0)}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdding ? 'Adding...' : 'ADD TO CART'}
                        </button>
                        <button
                            onClick={(e) => handleToggleWishlist(e, product.id)}
                            disabled={isToggling}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isInWishlist
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            {isToggling ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                            ) : isInWishlist ? (
                                <HeartIconSolid className="h-5 w-5" />
                            ) : (
                                <HeartIcon className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <AppLayout>
            <Container className="py-8">             

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* Featured Categories */}
                        {featuredCategories.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
                                <div className="flex overflow-x-auto gap-8 pb-4 scrollbar-hide">
                                    {featuredCategories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={(e) => handleCategoryClick(e, category)}
                                            className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-2 shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 border border-gray-200">
                                                <CategoryIcon 
                                                    icon={category.icon} 
                                                    className="h-8 w-8 text-purple-600"
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-800 text-center max-w-[80px] line-clamp-2">
                                                {category.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                     

                        {/* Featured Products */}
                        {products.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {products.map((product: any) => renderProductCard(product))}
                                </div>
                                
                                {/* Pagination */}
                                {pagination && pagination.last_page > 1 && (
                                    <div className="mt-8">
                                        <Pagination 
                                            data={pagination} 
                                            baseUrl="/"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recently Viewed Products */}
                        <RecentlyViewedProducts limit={4} showMoreLink={true} />
                    </>
                )}
            </Container>

            {/* Category Modal */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                parentCategory={selectedCategoryForModal}
                allCategories={allCategoriesForModal}
            />
        </AppLayout>
    );
}

