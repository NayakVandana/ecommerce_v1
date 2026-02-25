import AppLayout from '../Layouts/AppLayout';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from './useCategoryStore';
import { useProductStore } from '../Products/useProductStore';
import { ShoppingBagIcon, ArrowLeftIcon, TagIcon, HeartIcon, ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, FunnelIcon, XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Pagination from '../../Components/Pagination';
import { ProductCardSkeleton, CategoryPageSkeleton } from '../../Components/Skeleton';
import axios from 'axios';

export default function Show() {
    const { props, url } = usePage();
    const categorySlug = (props as any).slug;
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [category, setCategory] = useState<any>(null);
    const [products, setProducts] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    
    // Filter states
    const [filterOptions, setFilterOptions] = useState<any>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
    const [discountRange, setDiscountRange] = useState<[number, number]>([0, 100]);
    const [includeOutOfStock, setIncludeOutOfStock] = useState(false);
    const [sortBy, setSortBy] = useState('popularity');
    const [expandedFilters, setExpandedFilters] = useState<{[key: string]: boolean}>({
        availability: true,
        categories: true,
        colors: true,
        price: true,
        discount: true,
    });
    const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const isInitializingFilters = useRef(false);

    useEffect(() => {
        if (categorySlug) {
            fetchData();
        }
    }, [categorySlug, currentPage]);

    // Fetch filter options only when category changes
    useEffect(() => {
        if (category?.id) {
            isInitializingFilters.current = true;
            fetchFilterOptions();
        }
    }, [category?.id]);

    // Fetch products when filters or category changes (but not when initializing price/discount ranges)
    useEffect(() => {
        if (category?.id && filterOptions && !isInitializingFilters.current) {
            fetchProductsForCategory();
        }
    }, [category?.id, selectedCategories, selectedColors, includeOutOfStock, sortBy, currentPage]);

    // Separate effect for price and discount range changes (only after initialization)
    useEffect(() => {
        if (category?.id && filterOptions && !isInitializingFilters.current) {
            fetchProductsForCategory();
        }
    }, [priceRange, discountRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const categoryRes = await useCategoryStore.list();
            
            let categoriesArray = [];
            if (categoryRes.data?.status && categoryRes.data?.data) {
                if (categoryRes.data.data.flat && Array.isArray(categoryRes.data.data.flat)) {
                    categoriesArray = categoryRes.data.data.flat;
                } else if (Array.isArray(categoryRes.data.data)) {
                    categoriesArray = categoryRes.data.data;
                }
            }
            
            const foundCategory = categoriesArray.find((cat: any) => cat.slug === categorySlug);
            
            if (foundCategory) {
                setCategory(foundCategory);
            } else {
                setCategory(null);
                setProducts(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setCategory(null);
            setProducts(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async () => {
        try {
            const response = await axios.post('/api/products/filter-options', {
                category: category?.id
            });
            
            if (response.data?.status && response.data?.data) {
                setFilterOptions(response.data.data);
                // Initialize price and discount ranges only if they haven't been set yet
                if (response.data.data.price_range && priceRange[0] === 0 && priceRange[1] === 100000) {
                    setPriceRange([response.data.data.price_range.min, response.data.data.price_range.max]);
                }
                if (response.data.data.discount_range && discountRange[0] === 0 && discountRange[1] === 100) {
                    setDiscountRange([response.data.data.discount_range.min, response.data.data.discount_range.max]);
                }
                // After initializing filters, fetch products once
                setTimeout(() => {
                    isInitializingFilters.current = false;
                    if (category?.id) {
                        fetchProductsForCategory();
                    }
                }, 50);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
            isInitializingFilters.current = false;
        }
    };

    const fetchProductsForCategory = async () => {
        try {
            setProductsLoading(true);
            const filters: any = {
                category: category?.id,
                page: currentPage,
                per_page: 12,
                sort_by: sortBy,
            };

            if (selectedCategories.length > 0) {
                filters.categories = selectedCategories;
            }
            if (selectedColors.length > 0) {
                filters.colors = selectedColors;
            }
            if (priceRange[0] > 0 || priceRange[1] < 100000) {
                filters.min_price = priceRange[0];
                filters.max_price = priceRange[1];
            }
            if (discountRange[0] > 0 || discountRange[1] < 100) {
                filters.min_discount = discountRange[0];
                filters.max_discount = discountRange[1];
            }
            if (!includeOutOfStock) {
                filters.include_out_of_stock = false;
            }

            const response = await useProductStore.list(filters);
            
            if (response?.data?.status && response.data.data) {
                setProducts(response.data.data);
            } else {
                setProducts(null);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts(null);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleCategoryToggle = (categoryId: number) => {
        setSelectedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleColorToggle = (color: string) => {
        setSelectedColors(prev => 
            prev.includes(color) 
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const toggleCategoryExpand = (categoryId: number) => {
        setExpandedCategoryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const toggleFilterSection = (section: string) => {
        setExpandedFilters(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedColors([]);
        if (filterOptions) {
            setPriceRange([filterOptions.price_range?.min || 0, filterOptions.price_range?.max || 100000]);
            setDiscountRange([filterOptions.discount_range?.min || 0, filterOptions.discount_range?.max || 100]);
        }
        setIncludeOutOfStock(false);
        setSortBy('popularity');
    };

    const renderProductCard = (product: any) => {
        const primaryImage = product.media?.find((m: any) => m.is_primary) || product.media?.[0];
        const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
        const displayPrice = product.final_price || product.price;
        const mrp = product.mrp;
        const discount = product.discount_percent ? parseFloat(product.discount_percent) : 0;
        
        return (
            <div
                key={product.id}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-indigo-300 flex flex-col"
            >
                <Link
                    href={`/products/${product.id}`}
                    className="relative h-48 sm:h-56 lg:h-64 bg-gray-100 overflow-hidden"
                >
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.product_name} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <ShoppingBagIcon className="h-12 w-12 text-gray-300" />
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <span className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded text-[10px] sm:text-xs font-semibold shadow-md">
                                {Math.round(discount)}% OFF
                            </span>
                        </div>
                    )}
                </Link>
                <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                    <Link href={`/products/${product.id}`} className="flex-1 mb-2 sm:mb-3">
                        {product.brand && (
                            <div className="mb-1 sm:mb-2">
                                <span className="inline-block px-1.5 sm:px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs font-medium rounded uppercase">
                                    {product.brand}
                                </span>
                            </div>
                        )}
                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 line-clamp-2 text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight sm:leading-snug">
                            {product.product_name}
                        </h3>
                        {/* Description hidden on mobile */}
                        {/* <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 min-h-[2.5rem] hidden sm:block">
                            {product.description}
                        </p> */}
                    </Link>
                    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <p className="text-base sm:text-xl lg:text-2xl font-bold text-indigo-600">
                            ₹{displayPrice}
                        </p>
                        {mrp && mrp > displayPrice && (
                            <p className="text-gray-400 line-through text-xs sm:text-sm">₹{mrp}</p>
                        )}
                    </div>
                    {product.total_quantity !== null && (
                        <div className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium mb-2 sm:mb-3 ${
                            product.total_quantity > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                        }`}>
                            <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${
                                product.total_quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span>{product.total_quantity > 0 ? `${product.total_quantity} in stock` : 'Out of stock'}</span>
                        </div>
                    )}
                    {/* Add to Cart Button */}
                    {/* <button
                        onClick={(e) => {
                            e.preventDefault();
                            router.visit(`/products/${product.id}`);
                        }}
                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-2 sm:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg font-semibold text-xs sm:text-sm lg:text-base hover:from-indigo-700 hover:to-indigo-800 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-auto"
                    >
                        <ShoppingCartIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:hidden" />
                        <span className="hidden sm:inline">VIEW PRODUCT</span>
                    </button> */}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <AppLayout>
                <CategoryPageSkeleton />
            </AppLayout>
        );
    }

    if (!category) {
        return (
            <AppLayout>
                <div className="min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Link href="/categories" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6">
                            <ArrowLeftIcon className="h-5 w-5" />
                            <span>Back to Categories</span>
                        </Link>
                        <div className="text-center py-20">
                            <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h2>
                            <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Build breadcrumb
    const buildBreadcrumb = () => {
        const breadcrumbs = [
            { name: 'Home', href: '/' },
            { name: 'All Categories', href: '/categories' },
        ];
        
        // Add parent categories if available
        if (category.parent) {
            breadcrumbs.push({ name: category.parent.name, href: `/categories/${category.parent.slug}` });
        }
        
        breadcrumbs.push({ name: category.name, href: '#' });
        return breadcrumbs;
    };

    const breadcrumbs = buildBreadcrumb();

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Breadcrumb */}
                    <nav className="mb-6">
                        <ol className="flex items-center space-x-2 text-sm">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index} className="flex items-center">
                                    {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                                    {index === breadcrumbs.length - 1 ? (
                                        <span className="text-gray-900 font-medium">{crumb.name}</span>
                                    ) : (
                                        <Link href={crumb.href} className="text-indigo-600 hover:text-indigo-800">
                                            {crumb.name}
                    </Link>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>

                    {/* Mobile Filter & Sort Bar */}
                    <div className="lg:hidden mb-4 flex items-center gap-3">
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-md"
                        >
                            <FunnelIcon className="h-5 w-5" />
                            <span>Filters</span>
                            {(selectedCategories.length > 0 || 
                              selectedColors.length > 0 ||
                              priceRange[0] > (filterOptions?.price_range?.min || 0) || 
                              priceRange[1] < (filterOptions?.price_range?.max || 100000) ||
                              discountRange[0] > 0 || discountRange[1] < 100 ||
                              includeOutOfStock) && (
                                <span className="bg-white text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                    {(selectedCategories.length + selectedColors.length + 
                                      (priceRange[0] > (filterOptions?.price_range?.min || 0) ? 1 : 0) +
                                      (priceRange[1] < (filterOptions?.price_range?.max || 100000) ? 1 : 0) +
                                      (discountRange[0] > 0 || discountRange[1] < 100 ? 1 : 0) +
                                      (includeOutOfStock ? 1 : 0))}
                                </span>
                            )}
                        </button>
                        <div className="flex-1">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="popularity">Sort: Popularity</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="discount">Discount</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Filters Sidebar - Hidden on mobile, shown on desktop */}
                        <div className="hidden lg:block w-full lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                                    {(selectedCategories.length > 0 || 
                                      selectedColors.length > 0 ||
                                      priceRange[0] > (filterOptions?.price_range?.min || 0) || 
                                      priceRange[1] < (filterOptions?.price_range?.max || 100000) ||
                                      discountRange[0] > 0 || discountRange[1] < 100) && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {/* Availability Filter */}
                                <div className="mb-6 border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleFilterSection('availability')}
                                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                    >
                                        <span>Availability</span>
                                        {expandedFilters.availability ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedFilters.availability && (
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={includeOutOfStock}
                                                onChange={(e) => setIncludeOutOfStock(e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Include Out of stock</span>
                                        </label>
                                    )}
                                </div>

                                {/* Colors Filter */}
                                {filterOptions?.colors && filterOptions.colors.length > 0 && (
                                    <div className="mb-6 border-b border-gray-200 pb-4">
                                        <button
                                            onClick={() => toggleFilterSection('colors')}
                                            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                        >
                                            <span>Colors</span>
                                            {expandedFilters.colors ? (
                                                <ChevronUpIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        {expandedFilters.colors && (
                                            <div className="flex flex-wrap gap-2">
                                                {filterOptions.colors.map((color: string) => {
                                                    const isSelected = selectedColors.includes(color);
                                                    // Try to parse color as hex, otherwise use as-is
                                                    const isHexColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
                                                    const colorValue = isHexColor ? color : color;
                                                    
                                                    return (
                                                        <button
                                                            key={color}
                                                            onClick={() => handleColorToggle(color)}
                                                            className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                                                                isSelected 
                                                                    ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110' 
                                                                    : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                            style={{
                                                                backgroundColor: isHexColor ? colorValue : 'transparent',
                                                                borderColor: isSelected ? '#4f46e5' : undefined
                                                            }}
                                                            title={color}
                                                        >
                                                            {isSelected && (
                                                                <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            {!isHexColor && (
                                                                <span className="text-xs font-medium text-gray-700">{color.substring(0, 2)}</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Categories Filter */}
                                {filterOptions?.categories && filterOptions.categories.length > 0 && (
                                    <div className="mb-6 border-b border-gray-200 pb-4">
                                        <button
                                            onClick={() => toggleFilterSection('categories')}
                                            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                        >
                                            <span>Categories</span>
                                            {expandedFilters.categories ? (
                                                <ChevronUpIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        {expandedFilters.categories && (
                                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                                {filterOptions.categories.map((cat: any) => {
                                                    const hasChildren = cat.children && cat.children.length > 0;
                                                    const isExpanded = expandedCategoryIds.has(cat.id);
                                                    
                                                    return (
                                                        <div key={cat.id} className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {hasChildren && (
                                                                    <button
                                                                        onClick={() => toggleCategoryExpand(cat.id)}
                                                                        className="p-0.5 hover:bg-gray-100 rounded"
                                                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronDownIcon className="h-3 w-3 text-gray-600" />
                                                                        ) : (
                                                                            <ChevronRightIcon className="h-3 w-3 text-gray-600" />
                                                                        )}
                                                                    </button>
                                                                )}
                                                                {!hasChildren && <div className="w-4" />}
                                                                <label className="flex items-center flex-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedCategories.includes(cat.id)}
                                                                        onChange={() => handleCategoryToggle(cat.id)}
                                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <span className="ml-2 text-sm text-gray-700">
                                                                        {cat.name} 
                                                                        {/* ({cat.products_count || 0}) */}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                            {hasChildren && isExpanded && (
                                                                <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
                                                                    {cat.children.map((subCat: any) => (
                                                                        <label key={subCat.id} className="flex items-center cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedCategories.includes(subCat.id)}
                                                                                onChange={() => handleCategoryToggle(subCat.id)}
                                                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                            />
                                                                            <span className="ml-2 text-sm text-gray-600">
                                                                                {subCat.name} ({subCat.products_count || 0})
                                                                            </span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Price Range Filter */}
                                {filterOptions?.price_range && (
                                    <div className="mb-6 border-b border-gray-200 pb-4">
                                        <button
                                            onClick={() => toggleFilterSection('price')}
                                            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                        >
                                            <span>Price</span>
                                            {expandedFilters.price ? (
                                                <ChevronUpIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        {expandedFilters.price && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={priceRange[0]}
                                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                        min={filterOptions.price_range.min}
                                                        max={filterOptions.price_range.max}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        placeholder="Min"
                                                    />
                                                    <span className="text-gray-500">-</span>
                                                    <input
                                                        type="number"
                                                        value={priceRange[1]}
                                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                        min={filterOptions.price_range.min}
                                                        max={filterOptions.price_range.max}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        placeholder="Max"
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min={filterOptions.price_range.min}
                                                    max={filterOptions.price_range.max}
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Discount Range Filter */}
                                {filterOptions?.discount_range && (
                                    <div className="mb-6">
                                        <button
                                            onClick={() => toggleFilterSection('discount')}
                                            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                        >
                                            <span>Discount</span>
                                            {expandedFilters.discount ? (
                                                <ChevronUpIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                        {expandedFilters.discount && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={discountRange[0]}
                                                        onChange={(e) => setDiscountRange([Number(e.target.value), discountRange[1]])}
                                                        min={0}
                                                        max={100}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        placeholder="Min %"
                                                    />
                                                    <span className="text-gray-500">-</span>
                                                    <input
                                                        type="number"
                                                        value={discountRange[1]}
                                                        onChange={(e) => setDiscountRange([discountRange[0], Number(e.target.value)])}
                                                        min={0}
                                                        max={100}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                        placeholder="Max %"
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={discountRange[1]}
                                                    onChange={(e) => setDiscountRange([discountRange[0], Number(e.target.value)])}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                            </div>
                                )}
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="flex-1">
                            {/* Mobile Category Title */}
                            <div className="lg:hidden mb-4">
                                <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                                {products && (
                                    <p className="text-gray-500 text-xs mt-1">
                                        {products.total || 0} {products.total === 1 ? 'product' : 'products'} found
                                    </p>
                                )}
                            </div>

                            {/* Header with Sort - Hidden on mobile, shown on desktop */}
                            <div className="hidden lg:flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                                    {products && (
                                        <p className="text-gray-500 text-sm mt-1">
                                            {products.total || 0} {products.total === 1 ? 'product' : 'products'} found
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-700">Sort by:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="popularity">Popularity</option>
                                        <option value="price_low">Price: Low to High</option>
                                        <option value="price_high">Price: High to Low</option>
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="discount">Discount</option>
                                    </select>
                                </div>
                            </div>

                    {productsLoading ? (
                        <ProductCardSkeleton count={9} />
                    ) : products && products.data && products.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
                                {products.data.map((product: any) => renderProductCard(product))}
                            </div>
                            {products.last_page > 1 && (
                                <div className="mt-8">
                                    <Pagination 
                                        data={products} 
                                        baseUrl={`/categories/${categorySlug}`}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
                            <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                                    <p className="text-gray-600 mb-6">There are no products available matching your filters.</p>
                                    <button
                                        onClick={clearFilters}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setShowMobileFilters(false)}
                    ></div>
                    
                    {/* Filter Drawer */}
                    <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 lg:hidden overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {(selectedCategories.length > 0 || 
                              selectedColors.length > 0 ||
                              priceRange[0] > (filterOptions?.price_range?.min || 0) || 
                              priceRange[1] < (filterOptions?.price_range?.max || 100000) ||
                              discountRange[0] > 0 || discountRange[1] < 100) && (
                                <div className="mb-4">
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            )}

                            {/* Availability Filter */}
                            <div className="mb-6 border-b border-gray-200 pb-4">
                                <button
                                    onClick={() => toggleFilterSection('availability')}
                                    className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                >
                                    <span>Availability</span>
                                    {expandedFilters.availability ? (
                                        <ChevronUpIcon className="h-4 w-4" />
                                    ) : (
                                        <ChevronDownIcon className="h-4 w-4" />
                                    )}
                                </button>
                                {expandedFilters.availability && (
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={includeOutOfStock}
                                            onChange={(e) => setIncludeOutOfStock(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Include out of stock</span>
                                    </label>
                                )}
                            </div>

                            {/* Colors Filter */}
                            {filterOptions?.colors && filterOptions.colors.length > 0 && (
                                <div className="mb-6 border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleFilterSection('colors')}
                                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                    >
                                        <span>Colors</span>
                                        {expandedFilters.colors ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedFilters.colors && (
                                        <div className="flex flex-wrap gap-2">
                                            {filterOptions.colors.map((color: string) => {
                                                const isSelected = selectedColors.includes(color);
                                                const isHexColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
                                                return (
                                                    <button
                                                        key={color}
                                                        onClick={() => handleColorToggle(color)}
                                                        className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                                                            isSelected 
                                                                ? 'border-indigo-600 ring-2 ring-indigo-200 scale-110' 
                                                                : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        style={{
                                                            backgroundColor: isHexColor ? color : 'transparent',
                                                            borderColor: isSelected ? '#4f46e5' : undefined
                                                        }}
                                                        title={color}
                                                    >
                                                        {isSelected && (
                                                            <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        {!isHexColor && (
                                                            <span className="text-xs font-medium text-gray-700">{color.substring(0, 2)}</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Categories Filter */}
                            {filterOptions?.categories && filterOptions.categories.length > 0 && (
                                <div className="mb-6 border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleFilterSection('categories')}
                                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                    >
                                        <span>Categories</span>
                                        {expandedFilters.categories ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedFilters.categories && (
                                        <div className="space-y-1 max-h-60 overflow-y-auto">
                                            {filterOptions.categories.map((cat: any) => {
                                                const hasChildren = cat.children && cat.children.length > 0;
                                                const isExpanded = expandedCategoryIds.has(cat.id);
                                                return (
                                                    <div key={cat.id} className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            {hasChildren && (
                                                                <button
                                                                    onClick={() => toggleCategoryExpand(cat.id)}
                                                                    className="p-0.5 hover:bg-gray-100 rounded"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDownIcon className="h-3 w-3 text-gray-600" />
                                                                    ) : (
                                                                        <ChevronRightIcon className="h-3 w-3 text-gray-600" />
                                                                    )}
                                                                </button>
                                                            )}
                                                            {!hasChildren && <div className="w-4" />}
                                                            <label className="flex items-center flex-1 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCategories.includes(cat.id)}
                                                                    onChange={() => handleCategoryToggle(cat.id)}
                                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <span className="ml-2 text-sm text-gray-700">{cat.name}</span>
                                                            </label>
                                                        </div>
                                                        {hasChildren && isExpanded && (
                                                            <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
                                                                {cat.children.map((subCat: any) => (
                                                                    <label key={subCat.id} className="flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedCategories.includes(subCat.id)}
                                                                            onChange={() => handleCategoryToggle(subCat.id)}
                                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                        <span className="ml-2 text-sm text-gray-600">{subCat.name}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Price Range Filter */}
                            {filterOptions?.price_range && (
                                <div className="mb-6 border-b border-gray-200 pb-4">
                                    <button
                                        onClick={() => toggleFilterSection('price')}
                                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                    >
                                        <span>Price</span>
                                        {expandedFilters.price ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedFilters.price && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={priceRange[0]}
                                                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                                    min={filterOptions.price_range.min}
                                                    max={filterOptions.price_range.max}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholder="Min"
                                                />
                                                <span className="text-gray-500">-</span>
                                                <input
                                                    type="number"
                                                    value={priceRange[1]}
                                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                    min={filterOptions.price_range.min}
                                                    max={filterOptions.price_range.max}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholder="Max"
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min={filterOptions.price_range.min}
                                                max={filterOptions.price_range.max}
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Discount Range Filter */}
                            {filterOptions?.discount_range && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => toggleFilterSection('discount')}
                                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                                    >
                                        <span>Discount</span>
                                        {expandedFilters.discount ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                    {expandedFilters.discount && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={discountRange[0]}
                                                    onChange={(e) => setDiscountRange([Number(e.target.value), discountRange[1]])}
                                                    min={0}
                                                    max={100}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholder="Min %"
                                                />
                                                <span className="text-gray-500">-</span>
                                                <input
                                                    type="number"
                                                    value={discountRange[1]}
                                                    onChange={(e) => setDiscountRange([discountRange[0], Number(e.target.value)])}
                                                    min={0}
                                                    max={100}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                    placeholder="Max %"
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={discountRange[1]}
                                                onChange={(e) => setDiscountRange([discountRange[0], Number(e.target.value)])}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Apply Button */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 mt-4">
                                <button
                                    onClick={() => setShowMobileFilters(false)}
                                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
