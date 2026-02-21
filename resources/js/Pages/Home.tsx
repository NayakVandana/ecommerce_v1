import AppLayout from './Layouts/AppLayout';
import Container from '../Components/Container';
import Card from '../Components/Card';
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
import CategoriesHeader from '../Components/CategoriesHeader';

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
    const [specificCategories, setSpecificCategories] = useState<any[]>([]);

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

    const findSpecificCategories = (categories: any[]): void => {
        const targetSlugs = ['sarees', 'kurtas-suits', 'kurtas-and-suits'];
        const found: any[] = [];

        const searchCategories = (cats: any[]): void => {
            for (const cat of cats) {
                const slug = cat.slug?.toLowerCase();
                if (slug && targetSlugs.includes(slug)) {
                    found.push(cat);
                }
                if (cat.children && Array.isArray(cat.children)) {
                    searchCategories(cat.children);
                }
            }
        };

        searchCategories(categories);
        setSpecificCategories(found);
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
                    // Find specific categories: Sarees and Kurtas & Suits
                    findSpecificCategories(categoriesData.hierarchical);
                } else if (categoriesData.flat && Array.isArray(categoriesData.flat) && categoriesData.flat.length > 0) {
                    setAllCategoriesForModal(categoriesData.flat);
                    // Find specific categories from flat array
                    findSpecificCategories(categoriesData.flat);
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
            <Card key={product.id} hover padding="none" className="overflow-hidden flex flex-col group bg-white border border-gray-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
                <Link href={`/products/${product.id}`} className="relative overflow-hidden">
                    <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={product.product_name} 
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                        ) : (
                            <span className="text-gray-400">No Image</span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
                        {discount > 0 && (
                            <span className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                {discount}% OFF
                            </span>
                        )}
                        <button
                            onClick={(e) => handleToggleWishlist(e, product.id)}
                            disabled={isToggling}
                            className="absolute top-3 left-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all duration-200 disabled:opacity-50 z-10"
                            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            {isToggling ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                            ) : isInWishlist ? (
                                <HeartIconSolid className="h-5 w-5 text-red-600" />
                            ) : (
                                <HeartIcon className="h-5 w-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                </Link>
                <div className="p-5 flex-1 flex flex-col bg-white">
                    <Link href={`/products/${product.id}`} className="flex-1">
                        {product.brand && (
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">{product.brand}</p>
                        )}
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-indigo-600 transition-colors text-gray-900 leading-tight">
                            {product.product_name}
                        </h3>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
                    </Link>
                    <div className="flex items-baseline gap-2 mb-4">
                        <p className="text-2xl font-bold text-gray-900">₹{displayPrice}</p>
                        {mrp && mrp > displayPrice && (
                            <>
                                <p className="text-gray-400 line-through text-sm">₹{mrp}</p>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                    Save ₹{mrp - displayPrice}
                                </span>
                            </>
                        )}
                    </div>
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 mb-4">
                        <label className="text-sm font-medium text-gray-700">Qty:</label>
                        <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-indigo-500 transition-colors">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(product.id, -1);
                                }}
                                className="px-3 py-1.5 hover:bg-gray-100 active:bg-gray-200 transition-colors font-semibold text-gray-700"
                            >
                                −
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
                                className="w-16 px-2 py-1.5 text-center border-x-2 border-gray-200 focus:outline-none focus:ring-0 font-semibold text-gray-900"
                            />
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleQuantityChange(product.id, 1);
                                }}
                                className="px-3 py-1.5 hover:bg-gray-100 active:bg-gray-200 transition-colors font-semibold text-gray-700"
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
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-indigo-800 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md hover:shadow-lg"
                        >
                            {isAdding ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Adding...
                                </span>
                            ) : (
                                'ADD TO CART'
                            )}
                        </button>
                        <button
                            onClick={(e) => handleToggleWishlist(e, product.id)}
                            disabled={isToggling}
                            className={`px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                                isInWishlist
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                            }`}
                            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            {isToggling ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
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
            <CategoriesHeader />
            <div className="min-h-screen bg-gray-50">
                <Container className="py-8">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600 text-lg">Loading...</p>
                        </div>
                    ) : (
                        <>
                            {/* Featured Collections */}
                            {specificCategories.length > 0 && (
                                <div className="mb-10">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Collections</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {specificCategories.map((category) => (
                                            <Link
                                                key={category.id}
                                                href={`/categories/${category.slug}`}
                                                className="group relative overflow-hidden rounded-lg bg-indigo-600 p-6 text-white hover:bg-indigo-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                                                        <CategoryIcon 
                                                            icon={category.icon} 
                                                            className="h-8 w-8 text-white"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                                                        <p className="text-indigo-100 text-sm mb-2">Explore our exclusive collection</p>
                                                        <span className="text-sm font-medium inline-flex items-center">
                                                            Shop Now →
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Featured Products */}
                            {products.length > 0 && (
                                <div className="mb-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                                        <Link 
                                            href="/products" 
                                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                                        >
                                            View All →
                                        </Link>
                                    </div>
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
                            <div className="mb-10">
                                <RecentlyViewedProducts limit={4} showMoreLink={true} />
                            </div>
                        </>
                    )}
                </Container>
            </div>

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

