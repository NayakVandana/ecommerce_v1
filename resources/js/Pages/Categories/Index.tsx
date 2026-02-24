import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { useCategoryStore } from './useCategoryStore';
import { useProductStore } from '../Products/useProductStore';
import { ProductCardSkeleton, CategoryListSkeleton } from '../../Components/Skeleton';
import { 
    ChevronRightIcon, 
    ChevronDownIcon,
    ChevronUpIcon,
    TagIcon,
    XMarkIcon,
    ShoppingBagIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Index() {
    const [categories, setCategories] = useState<any>([]);
    const [hierarchicalCategories, setHierarchicalCategories] = useState<any>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [products, setProducts] = useState<any>(null);
    const [productsLoading, setProductsLoading] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [productSortBy, setProductSortBy] = useState<string>('popularity');
    const [expandedFilters, setExpandedFilters] = useState<{[key: string]: boolean}>({
        categories: true,
    });

    useEffect(() => {
        fetchCategories();
        fetchAllProducts(); // Load all products by default
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await useCategoryStore.list();
            
            console.log('Raw API Response:', response);
            
            // API response structure:
            // response = { data: { status: true, message: '...', data: { flat: [...], hierarchical: [...] } } }
            // So: response.data.data = { flat: [...], hierarchical: [...] }
            
            let categoriesData = null;
            
            if (response?.data) {
                console.log('Response.data:', response.data);
                
                // Standard format: { status: true, message: '...', data: { flat: [...], hierarchical: [...] } }
                if (response.data.status === true && response.data.data) {
                    categoriesData = response.data.data;
                    console.log('Using standard format, categoriesData:', categoriesData);
                }
                // Fallback: response.data might be directly the data object
                else if (response.data.flat || response.data.hierarchical) {
                    categoriesData = response.data;
                    console.log('Using fallback format (direct data), categoriesData:', categoriesData);
                }
                // Fallback: response.data is an array
                else if (Array.isArray(response.data)) {
                    categoriesData = { flat: response.data, hierarchical: null };
                    console.log('Using fallback format (array), categoriesData:', categoriesData);
                }
            }
            
            console.log('Final categoriesData:', categoriesData);
            
            if (categoriesData) {
                // Priority 1: Use hierarchical structure if available and not empty
                if (categoriesData.hierarchical && Array.isArray(categoriesData.hierarchical) && categoriesData.hierarchical.length > 0) {
                    console.log('Using hierarchical structure:', categoriesData.hierarchical.length, 'main categories');
                    setHierarchicalCategories(categoriesData.hierarchical);
                    // Ensure flat categories are set for fallback
                    if (categoriesData.flat && Array.isArray(categoriesData.flat) && categoriesData.flat.length > 0) {
                        console.log('Setting flat categories:', categoriesData.flat.length, 'categories');
                        setCategories(categoriesData.flat);
                    } else {
                        // Build flat array from hierarchical if not provided
                        console.log('Building flat array from hierarchical');
                        const flat = flattenHierarchy(categoriesData.hierarchical);
                        setCategories(flat);
                    }
                } 
                // Priority 2: Build hierarchy from flat array
                else if (categoriesData.flat && Array.isArray(categoriesData.flat) && categoriesData.flat.length > 0) {
                    console.log('Building hierarchy from flat array:', categoriesData.flat.length, 'categories');
                    setCategories(categoriesData.flat);
                    const hierarchical = buildHierarchy(categoriesData.flat);
                    setHierarchicalCategories(hierarchical);
                }
                // Priority 3: If categoriesData is directly an array
                else if (Array.isArray(categoriesData) && categoriesData.length > 0) {
                    console.log('Using direct array format:', categoriesData.length, 'categories');
                    setCategories(categoriesData);
                    const hierarchical = buildHierarchy(categoriesData);
                    setHierarchicalCategories(hierarchical);
                }
                else {
                    console.warn('Categories data exists but is empty or invalid:', categoriesData);
                    setCategories([]);
                    setHierarchicalCategories([]);
                }
            } else {
                console.warn('No categories data found in API response:', response);
                setCategories([]);
                setHierarchicalCategories([]);
            }
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
            } else {
                console.error('Error message:', error.message);
            }
            setCategories([]);
            setHierarchicalCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchy = (flatCategories: any[]) => {
        if (!flatCategories || !Array.isArray(flatCategories) || flatCategories.length === 0) {
            return [];
        }
        
        // Create a map for quick lookup
        const categoryMap = new Map();
        flatCategories.forEach((cat: any) => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });
        
        // Build the tree structure
        const rootCategories: any[] = [];
        flatCategories.forEach((cat: any) => {
            const category = categoryMap.get(cat.id);
            if (!cat.parent_id) {
                rootCategories.push(category);
            } else {
                const parent = categoryMap.get(cat.parent_id);
                if (parent) {
                    parent.children.push(category);
                }
            }
        });
        
        return rootCategories;
    };

    const flattenHierarchy = (hierarchicalCategories: any[]): any[] => {
        const flat: any[] = [];
        
        const traverse = (categories: any[]) => {
            categories.forEach((cat: any) => {
                flat.push(cat);
                if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
                    traverse(cat.children);
                }
            });
        };
        
        traverse(hierarchicalCategories);
        return flat;
    };

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleCategoryClick = async (category: any, event: React.MouseEvent) => {
        event.preventDefault();
        setSelectedCategory(category);
        await fetchProductsForCategory(category.id);
    };

    const fetchAllProducts = async () => {
        try {
            setProductsLoading(true);
            const response = await useProductStore.list({ 
                page: 1,
                per_page: 12
            });
            
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

    const fetchProductsForCategory = async (categoryId: number) => {
        try {
            setProductsLoading(true);
            console.log('Fetching products for category:', categoryId);
            
            const response = await useProductStore.list({ 
                category: categoryId,
                page: 1,
                per_page: 12
            });
            
            console.log('Products API response:', response);
            
            if (response?.data?.status && response.data.data) {
                console.log('Products found:', response.data.data.data?.length || 0);
                setProducts(response.data.data);
            } else {
                console.warn('No products in response:', response?.data);
                setProducts(null);
            }
        } catch (error: any) {
            console.error('Error fetching products:', error);
            console.error('Error details:', error.response?.data || error.message);
            setProducts(null);
        } finally {
            setProductsLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedCategory(null);
        fetchAllProducts(); // Reload all products when clearing selection
    };

    // Filter categories based on search query
    const filteredHierarchicalCategories = useMemo(() => {
        if (!categorySearchQuery.trim()) {
            return hierarchicalCategories;
        }

        const query = categorySearchQuery.toLowerCase();
        const filterCategory = (cat: any): any | null => {
            const matchesName = cat.name?.toLowerCase().includes(query);
            const matchesDescription = cat.description?.toLowerCase().includes(query);
            
            // Filter children recursively
            const filteredChildren = cat.children
                ?.map((child: any) => filterCategory(child))
                .filter((child: any) => child !== null) || [];

            // Include category if it matches or has matching children
            if (matchesName || matchesDescription || filteredChildren.length > 0) {
                return {
                    ...cat,
                    children: filteredChildren
                };
            }
            return null;
        };

        return hierarchicalCategories
            .map((cat: any) => filterCategory(cat))
            .filter((cat: any) => cat !== null);
    }, [hierarchicalCategories, categorySearchQuery]);

    // Sort products
    const sortedProducts = useMemo(() => {
        if (!products?.data) return products;

        const sorted = [...products.data];
        switch (productSortBy) {
            case 'price-low':
                sorted.sort((a: any, b: any) => (a.final_price || a.price || 0) - (b.final_price || b.price || 0));
                break;
            case 'price-high':
                sorted.sort((a: any, b: any) => (b.final_price || b.price || 0) - (a.final_price || a.price || 0));
                break;
            case 'name':
                sorted.sort((a: any, b: any) => (a.product_name || '').localeCompare(b.product_name || ''));
                break;
            case 'discount':
                sorted.sort((a: any, b: any) => (b.discount_percent || 0) - (a.discount_percent || 0));
                break;
            default:
                // Keep original order for 'popularity'
                break;
        }

        return { ...products, data: sorted };
    }, [products, productSortBy]);

    const toggleFilterSection = (section: string) => {
        setExpandedFilters(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const renderProductCard = (product: any) => {
        const primaryImage = product.media?.find((m: any) => m.is_primary) || product.media?.[0];
        const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
        const displayPrice = product.final_price || product.price;
        const mrp = product.mrp;
        const discount = product.discount_percent ? parseFloat(product.discount_percent) : 0;
        
        return (
            <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-indigo-300"
            >
                <div className="relative h-48 bg-gray-100 overflow-hidden">
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
                        <div className="absolute top-2 right-2">
                            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
                                {Math.round(discount)}% OFF
                            </span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    {product.brand && (
                        <div className="mb-2">
                            <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded uppercase">
                                {product.brand}
                            </span>
                        </div>
                    )}
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {product.product_name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                        {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                            <p className="text-xl font-bold text-indigo-600">
                                ₹{displayPrice}
                            </p>
                            {mrp && mrp > displayPrice && (
                                <p className="text-gray-400 line-through text-sm">₹{mrp}</p>
                            )}
                        </div>
                    </div>
                    {product.total_quantity !== null && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            product.total_quantity > 0 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                        }`}>
                            <div className={`h-2 w-2 rounded-full ${
                                product.total_quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span>{product.total_quantity > 0 ? `${product.total_quantity} in stock` : 'Out of stock'}</span>
                        </div>
                    )}
                </div>
            </Link>
        );
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Categories</h1>
                        <p className="text-gray-500 text-sm">Browse products by category</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Categories Section */}
                        <div className="w-full lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                                    {selectedCategory && (
                                        <button
                                            onClick={clearSelection}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Search Bar */}
                                <div className="mb-4">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={categorySearchQuery}
                                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {categorySearchQuery && (
                                            <button
                                                onClick={() => setCategorySearchQuery('')}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Collapsible Categories Filter */}
                                <div className="border-b border-gray-200 pb-4">
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
                                        <>
                                        {loading ? (
                                        <CategoryListSkeleton />
                                    ) : filteredHierarchicalCategories && filteredHierarchicalCategories.length > 0 ? (
                                        <div className="space-y-1 max-h-96 overflow-y-auto">
                                            {filteredHierarchicalCategories.map((category: any) => {
                                                const renderCategoryItem = (cat: any, level: number = 0) => {
                                                    const hasChildren = cat.children && cat.children.length > 0;
                                                    const isExpanded = expandedCategories.has(cat.id);
                                                    
                                                    return (
                                                        <div key={cat.id} className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {hasChildren && (
                                                                    <button
                                                                        onClick={() => toggleCategory(cat.id)}
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
                                                                <label 
                                                                    className="flex items-center flex-1 cursor-pointer"
                                                                    onClick={(e) => handleCategoryClick(cat, e)}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedCategory?.id === cat.id}
                                                                        onChange={() => {}}
                                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <span className={`ml-2 text-sm ${level === 0 ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                                                                        {cat.name} 
                                                                        {/* ({cat.products_count || 0}) */}
                                                                    </span>
                                                                </label>
                                                            </div>
                                                            {hasChildren && isExpanded && (
                                                                <div className={`space-y-1 border-l-2 border-gray-200 pl-3 ${level === 0 ? 'ml-6' : 'ml-4'}`}>
                                                                    {cat.children.map((childCat: any) => renderCategoryItem(childCat, level + 1))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                };
                                                
                                                return renderCategoryItem(category, 0);
                                            })}
                                        </div>
                                    ) : categories && categories.length > 0 ? (
                                        // Fallback: Show flat list if hierarchy failed
                                        <div className="space-y-1 max-h-96 overflow-y-auto">
                                            {categories
                                                .filter((cat: any) => 
                                                    !categorySearchQuery || 
                                                    cat.name?.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
                                                    cat.description?.toLowerCase().includes(categorySearchQuery.toLowerCase())
                                                )
                                                .map((category: any) => (
                                                    <label 
                                                        key={category.id}
                                                        className="flex items-center cursor-pointer"
                                                        onClick={(e) => handleCategoryClick(category, e)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategory?.id === category.id}
                                                            onChange={() => {}}
                                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">
                                                            {category.name} ({category.products_count || 0})
                                                        </span>
                                                    </label>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <TagIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No categories found</p>
                                        </div>
                                    )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="flex-1">
                            {/* Header with Sort */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    {selectedCategory ? (
                                        <>
                                            <h1 className="text-3xl font-bold text-gray-900">{selectedCategory.name}</h1>
                                            {selectedCategory.description && (
                                                <p className="text-gray-500 text-sm mt-1">{selectedCategory.description}</p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
                                            <p className="text-gray-500 text-sm mt-1">Browse our complete collection</p>
                                        </>
                                    )}
                                    {sortedProducts && (
                                        <p className="text-gray-500 text-sm mt-1">
                                            {sortedProducts.total || 0} {sortedProducts.total === 1 ? 'product' : 'products'} found
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-700">Sort by:</label>
                                    <select
                                        value={productSortBy}
                                        onChange={(e) => setProductSortBy(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="popularity">Popularity</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="name">Name: A to Z</option>
                                        <option value="discount">Discount</option>
                                    </select>
                                </div>
                            </div>

                            {productsLoading ? (
                                <ProductCardSkeleton count={12} />
                            ) : sortedProducts && sortedProducts.data && sortedProducts.data.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {sortedProducts.data.map((product: any) => renderProductCard(product))}
                                    </div>
                                    {sortedProducts.last_page > 1 && (
                                        <div className="mt-8">
                                            <Link
                                                href={selectedCategory ? `/categories/${selectedCategory.slug}` : '/categories'}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                            >
                                                View All Products ({sortedProducts.total} total)
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {selectedCategory 
                                            ? `No products in "${selectedCategory.name}"` 
                                            : 'No products found'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {selectedCategory 
                                            ? 'Try selecting a different category or browse all products.' 
                                            : 'Products will appear here once they are added.'}
                                    </p>
                                    {selectedCategory && (
                                        <div className="flex items-center justify-center gap-4">
                                            <Link
                                                href={`/categories/${selectedCategory.slug}`}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                                            >
                                                View Category Page
                                            </Link>
                                            <button
                                                onClick={clearSelection}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium border border-gray-300"
                                            >
                                                View All Products
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
