import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCategoryStore } from './useCategoryStore';
import { useProductStore } from '../Products/useProductStore';
import { 
    ChevronRightIcon, 
    ChevronDownIcon,
    TagIcon,
    XMarkIcon,
    SparklesIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline';

export default function Index() {
    const [categories, setCategories] = useState<any>([]);
    const [hierarchicalCategories, setHierarchicalCategories] = useState<any>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [products, setProducts] = useState<any>(null);
    const [productsLoading, setProductsLoading] = useState(false);

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

    const renderCategory = (category: any, level: number = 0) => {
        // Handle children - could be array or collection
        const children = category.children || [];
        const childrenArray = Array.isArray(children) ? children : (children.toArray ? children.toArray() : []);
        const hasChildren = childrenArray.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategory?.id === category.id;

        // Color gradients for different levels
        const gradientColors = [
            'from-indigo-500 via-purple-500 to-pink-500',
            'from-blue-500 via-cyan-500 to-teal-500',
            'from-pink-500 via-rose-500 to-red-500',
            'from-emerald-500 via-teal-500 to-cyan-500',
            'from-orange-500 via-amber-500 to-yellow-500',
        ];
        const gradient = gradientColors[level % gradientColors.length];

        return (
            <div key={category.id} className="mb-2">
                <div 
                    className={`group relative flex items-center justify-between rounded-lg p-3 transition-all duration-200 ${
                        isSelected 
                            ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md' 
                            : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-300 shadow-sm hover:shadow-md'
                    }`}
                >
                    <div className="flex items-center flex-1 min-w-0">
                        {hasChildren && (
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className={`mr-2 p-1 rounded transition-all ${
                                    isSelected 
                                        ? 'hover:bg-indigo-100 text-indigo-700' 
                                        : 'hover:bg-gray-100 text-gray-600 hover:text-indigo-600'
                                }`}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            >
                                {isExpanded ? (
                                    <ChevronDownIcon className="h-4 w-4" />
                                ) : (
                                    <ChevronRightIcon className="h-4 w-4" />
                                )}
                            </button>
                        )}
                        {!hasChildren && <div className="w-6" />}
                        
                        <div
                            onClick={(e) => handleCategoryClick(category, e)}
                            className="flex-1 cursor-pointer min-w-0"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-all ${
                                    isSelected 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'
                                }`}>
                                    <TagIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-semibold truncate ${
                                        isSelected 
                                            ? 'text-indigo-900 text-base' 
                                            : level === 0 ? 'text-base text-gray-900 group-hover:text-indigo-600' : level === 1 ? 'text-sm text-gray-800' : 'text-sm text-gray-700'
                                    }`}>
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className={`text-xs mt-0.5 line-clamp-1 ${
                                            isSelected ? 'text-indigo-700' : 'text-gray-600'
                                        }`}>
                                            {category.description}
                                        </p>
                                    )}
                                    {category.products_count !== undefined && (
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <ShoppingBagIcon className={`h-3 w-3 ${
                                                isSelected ? 'text-indigo-600' : 'text-gray-400'
                                            }`} />
                                            <span className={`text-xs ${
                                                isSelected ? 'text-indigo-700 font-medium' : category.products_count > 0 ? 'text-indigo-600 font-medium' : 'text-gray-500'
                                            }`}>
                                                {category.products_count} {category.products_count === 1 ? 'product' : 'products'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <Link
                            href={`/categories/${category.slug}`}
                            className={`ml-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                isSelected
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    : 'bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            View
                        </Link>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200">
                        {childrenArray.map((child: any) => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
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
                                ${displayPrice}
                            </p>
                            {mrp && mrp > displayPrice && (
                                <p className="text-gray-400 line-through text-sm">${mrp}</p>
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
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #6366f1, #9333ea);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, #4f46e5, #7e22ce);
                }
            `}</style>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    All Categories
                                </h1>
                                <p className="text-gray-600">Browse products by category</p>
                            </div>
                            {selectedCategory && (
                                <button
                                    onClick={clearSelection}
                                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium">Clear Filter</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Categories Section */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                                        <SparklesIcon className="h-5 w-5 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Categories
                                        </h2>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="text-center py-16">
                                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                                            <p className="text-gray-500 text-sm mt-4 font-medium">Loading categories...</p>
                                        </div>
                                    ) : hierarchicalCategories && hierarchicalCategories.length > 0 ? (
                                        <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-3 custom-scrollbar">
                                            {hierarchicalCategories.map((category: any) => renderCategory(category, 0))}
                                        </div>
                                    ) : categories && categories.length > 0 ? (
                                        // Fallback: Show flat list if hierarchy failed
                                        <div className="grid grid-cols-1 gap-3">
                                            {categories.map((category: any) => (
                                                <div
                                                    key={category.id}
                                                    onClick={(e) => handleCategoryClick(category, e)}
                                                    className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                                                        selectedCategory?.id === category.id 
                                                            ? 'border-indigo-500 shadow-lg scale-105' 
                                                            : 'border-gray-100 hover:border-indigo-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-3 rounded-xl ${
                                                            selectedCategory?.id === category.id
                                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                                                : 'bg-gradient-to-br from-indigo-100 to-purple-100 group-hover:from-indigo-200 group-hover:to-purple-200'
                                                        }`}>
                                                            <TagIcon className={`h-6 w-6 ${
                                                                selectedCategory?.id === category.id ? 'text-white' : 'text-indigo-600'
                                                            }`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className={`font-bold text-lg mb-1 ${
                                                                selectedCategory?.id === category.id ? 'text-indigo-600' : 'text-gray-900'
                                                            }`}>
                                                                {category.name}
                                                            </h3>
                                                            {category.description && (
                                                                <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                                                                    {category.description}
                                                                </p>
                                                            )}
                                                            {category.products_count !== undefined && (
                                                                <p className="text-xs text-gray-500 font-medium">
                                                                    {category.products_count} {category.products_count === 1 ? 'product' : 'products'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <TagIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg font-medium">No categories found</p>
                                            <p className="text-gray-400 text-sm mt-2">Please check the browser console for details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Products Section */}
                        <div className="lg:col-span-2">
                            <div className="mb-6">
                                {selectedCategory ? (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                            Products in "{selectedCategory.name}"
                                        </h2>
                                        {selectedCategory.description && (
                                            <p className="text-gray-600 text-sm">{selectedCategory.description}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">All Products</h2>
                                        <p className="text-gray-600 text-sm">Browse our complete collection</p>
                                    </div>
                                )}
                            </div>

                            {productsLoading ? (
                                <div className="text-center py-24">
                                    <div className="relative inline-block">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                                        <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                                    </div>
                                    <p className="text-gray-600 text-lg font-semibold mt-6">Loading products...</p>
                                    <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
                                </div>
                            ) : products && products.data && products.data.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {products.data.map((product: any) => renderProductCard(product))}
                                    </div>
                                    {products.last_page > 1 && (
                                        <div className="mt-10 text-center">
                                            <Link
                                                href={selectedCategory ? `/categories/${selectedCategory.slug}` : '/products'}
                                                className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl hover:shadow-3xl font-bold text-lg transform hover:scale-105"
                                            >
                                                <span>View All Products ({products.total} total)</span>
                                                <ChevronRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-24 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-100">
                                    <div className="relative inline-block mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-20"></div>
                                        <div className="relative p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full">
                                            <ShoppingBagIcon className="h-20 w-20 text-gray-400" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-gray-800 mb-3">
                                        {selectedCategory 
                                            ? `No products in "${selectedCategory.name}"` 
                                            : 'No products found'}
                                    </h3>
                                    <p className="text-gray-600 text-lg font-medium mb-6 max-w-md mx-auto">
                                        {selectedCategory 
                                            ? 'Try selecting a different category or browse all products.' 
                                            : 'Products will appear here once they are added.'}
                                    </p>
                                    <div className="flex items-center justify-center gap-4">
                                        {selectedCategory && (
                                            <>
                                                <Link
                                                    href={`/categories/${selectedCategory.slug}`}
                                                    className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold transform hover:scale-105"
                                                >
                                                    View Category Page
                                                    <ChevronRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                                <button
                                                    onClick={clearSelection}
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold border-2 border-gray-200 hover:border-indigo-300 transform hover:scale-105"
                                                >
                                                    View All Products
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
