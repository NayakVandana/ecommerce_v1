import AppLayout from './Layouts/AppLayout';
import Container from '../Components/Container';
import Card from '../Components/Card';
import { Link, usePage, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { useProductStore } from './Products/useProductStore';
import { useCategoryStore } from './Categories/useCategoryStore';
import { useCartStore } from './Cart/useCartStore';
import { useWishlistStore } from './Wishlist/useWishlistStore';
import toast from '../utils/toast';
import { HeartIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import RecentlyViewedProducts from '../Components/RecentlyViewedProducts';
import Pagination from '../Components/Pagination';
import CategoryIcon from '../Components/CategoryIcon';
import CategoryModal from '../Components/CategoryModal';
import CategoriesHeader from '../Components/CategoriesHeader';
import { ProductCardSkeleton } from '../Components/Skeleton';

export default function Home() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [products, setProducts] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});
    const [wishlistStatus, setWishlistStatus] = useState<{ [key: number]: boolean }>({});
    const [togglingWishlist, setTogglingWishlist] = useState<{ [key: number]: boolean }>({});
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<any>(null);
    const [allCategoriesForModal, setAllCategoriesForModal] = useState<any[]>([]);
    const [specificCategories, setSpecificCategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    // Fetch search suggestions as user types
    useEffect(() => {
        if (searchTerm.trim().length >= 2) {
            // Clear previous timeout
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            
            // Set new timeout for debounced search
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    setLoadingSuggestions(true);
                    const response = await useProductStore.searchSuggestions({ 
                        query: searchTerm.trim(),
                        limit: 10 
                    });
                    
                    if (response.data?.status && response.data?.data?.suggestions) {
                        setSearchSuggestions(response.data.data.suggestions);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error('Error fetching search suggestions:', error);
                    setSearchSuggestions([]);
                } finally {
                    setLoadingSuggestions(false);
                }
            }, 300); // 300ms debounce
        } else {
            setSearchSuggestions([]);
            setShowSuggestions(false);
        }

        // Cleanup timeout on unmount or when searchTerm changes
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const handleAddToCart = async (e: React.MouseEvent, product: any) => {
        e.preventDefault();
        e.stopPropagation();
        
        const quantity = 1;
        
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

    const handleSearch = async (e?: React.FormEvent, searchQuery?: string) => {
        if (e) {
            e.preventDefault();
        }
        
        const query = searchQuery || searchTerm.trim();
        
        if (!query) {
            // If search is empty, fetch normal products
            fetchData();
            setShowSuggestions(false);
            return;
        }
        
        try {
            setIsSearching(true);
            setLoading(true);
            setShowSuggestions(false);
            setSearchTerm(query);
            
            const response = await useProductStore.search({ query: query });
            
            if (response.data?.status && response.data?.data) {
                setProducts(response.data.data.data || []);
                setPagination(response.data.data);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            toast({ type: 'error', message: 'Failed to search products' });
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const handleSuggestionClick = (suggestion: any) => {
        setSearchTerm(suggestion.text);
        setShowSuggestions(false);
        
        // Navigate based on suggestion type
        if (suggestion.type === 'category') {
            // Navigate to category page
            if (suggestion.slug) {
                router.visit(`/categories/${suggestion.slug}`);
            } else if (suggestion.id) {
                router.visit(`/categories/${suggestion.id}`);
            } else {
                // Fallback to search if no slug or id
                handleSearch(undefined, suggestion.text);
            }
        } else if (suggestion.type === 'product') {
            // Navigate to product page
            if (suggestion.id) {
                router.visit(`/products/${suggestion.id}`);
            } else {
                // Fallback to search if no id
                handleSearch(undefined, suggestion.text);
            }
        } else {
            // For brand or other types, perform search
            handleSearch(undefined, suggestion.text);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchSuggestions([]);
        setShowSuggestions(false);
        fetchData();
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const searchParams: any = { page: currentPage, per_page: 8 };
            
            // Add search term if it exists
            if (searchTerm.trim()) {
                searchParams.search = searchTerm.trim();
            }
            
            const [productsRes, categoriesRes, allCategoriesRes] = await Promise.all([
                useProductStore.list(searchParams),
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
                <div className="p-4 sm:p-5 flex-1 flex flex-col bg-white">
                    <Link href={`/products/${product.id}`} className="flex-1 mb-3">
                        {product.brand && (
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1.5">{product.brand}</p>
                        )}
                        <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 hover:text-indigo-600 transition-colors text-gray-900 leading-snug">
                            {product.product_name}
                        </h3>
                        {product.description && (
                            <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">{product.description}</p>
                        )}
                    </Link>
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{Number(displayPrice).toFixed(2)}</p>
                        {mrp && mrp > displayPrice && (
                            <>
                                <p className="text-gray-400 line-through text-sm">₹{Number(mrp).toFixed(2)}</p>
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                                    Save ₹{Number(mrp - displayPrice).toFixed(2)}
                                </span>
                            </>
                        )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <div className="flex gap-2 mt-auto">
                        <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={isAdding || (product.total_quantity !== null && product.total_quantity === 0)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:from-indigo-700 hover:to-indigo-800 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm hover:shadow-md"
                        >
                            {isAdding ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span className="hidden sm:inline">Adding...</span>
                                    <span className="sm:hidden">...</span>
                                </span>
                            ) : (
                                <span className="hidden sm:inline">ADD TO CART</span>
                            )}
                            {!isAdding && <span className="sm:hidden">ADD</span>}
                        </button>
                        <button
                            onClick={(e) => handleToggleWishlist(e, product.id)}
                            disabled={isToggling}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center ${
                                isInWishlist
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm hover:shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
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
                        <ProductCardSkeleton count={8} />
                    ) : (
                        <>
                            {/* Search Bar */}
                            <div className="mb-8 relative max-w-2xl mx-auto">
                                <form onSubmit={handleSearch} className="relative">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                if (e.target.value.trim().length >= 2) {
                                                    setShowSuggestions(true);
                                                }
                                            }}
                                            onFocus={() => {
                                                if (searchSuggestions.length > 0) {
                                                    setShowSuggestions(true);
                                                }
                                            }}
                                            placeholder="Search for products, brands, or keywords..."
                                            className="block w-full pl-12 pr-12 py-4 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={handleClearSearch}
                                                className="absolute inset-y-0 right-12 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={isSearching}
                                            className="absolute inset-y-0 right-0 px-6 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                        >
                                            {isSearching ? 'Searching...' : 'Search'}
                                        </button>
                                    </div>
                                </form>

                                {/* Search Suggestions Dropdown */}
                                {showSuggestions && (searchSuggestions.length > 0 || loadingSuggestions) && (
                                    <div
                                        ref={suggestionsRef}
                                        className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto"
                                    >
                                        {loadingSuggestions ? (
                                            <div className="p-4 text-center text-gray-500">
                                                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                                                <span className="ml-2">Searching...</span>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Suggestions</p>
                                                </div>
                                                {searchSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                            <span className="text-sm text-gray-900 flex-1">{suggestion.text}</span>
                                                            {suggestion.type === 'product' && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Product</span>
                                                            )}
                                                            {suggestion.type === 'brand' && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Brand</span>
                                                            )}
                                                            {suggestion.type === 'category' && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Category</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Search Results Header */}
                            {searchTerm && (
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {products.length > 0 
                                            ? `Search Results for "${searchTerm}" (${pagination?.total || products.length} found)`
                                            : `No products found for "${searchTerm}"`
                                        }
                                    </h2>
                                </div>
                            )}

                            {/* Featured Collections - Only show when not searching */}
                            {!searchTerm && specificCategories.length > 0 && (
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

                            {/* Featured Products / Search Results */}
                            {products.length > 0 && (
                                <div className="mb-10">
                                    {!searchTerm && (
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
                                    )}
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

