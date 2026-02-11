import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCategoryStore } from './useCategoryStore';
import { useProductStore } from '../Products/useProductStore';
import { useWishlistStore } from '../Wishlist/useWishlistStore';
import { ShoppingBagIcon, ArrowLeftIcon, TagIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Pagination from '../../Components/Pagination';
import { useState as useReactState } from 'react';

export default function Show() {
    const { props, url } = usePage();
    const categorySlug = (props as any).slug;
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const currentPage = parseInt(urlParams.get('page') || '1', 10);
    
    const [category, setCategory] = useState<any>(null);
    const [products, setProducts] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);

    useEffect(() => {
        if (categorySlug) {
            fetchData();
        }
    }, [categorySlug, currentPage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Get all categories to find the one matching the slug
            const categoryRes = await useCategoryStore.list();
            
            // Handle new API response structure: { flat: [...], hierarchical: [...] }
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
                await fetchProductsForCategory(foundCategory.id);
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

    const fetchProductsForCategory = async (categoryId: number) => {
        try {
            setProductsLoading(true);
            const response = await useProductStore.list({ 
                category: categoryId,
                page: currentPage,
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

    if (loading) {
        return (
            <AppLayout>
                <div className="min-h-screen bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                            <p className="text-gray-500 text-lg mt-4 font-medium">Loading category...</p>
                        </div>
                    </div>
                </div>
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

    return (
        <AppLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6">
                        <ArrowLeftIcon className="h-5 w-5" />
                        <span>Back to Home</span>
                    </Link>

                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <TagIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
                                {category.products_count !== undefined && (
                                    <p className="text-gray-500 text-sm mt-1">
                                        {category.products_count} {category.products_count === 1 ? 'product' : 'products'} available
                                    </p>
                                )}
                            </div>
                        </div>
                        {category.description && (
                            <p className="text-gray-600 ml-12">{category.description}</p>
                        )}
                    </div>

                    {productsLoading ? (
                        <div className="text-center py-20">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                            <p className="text-gray-500 text-lg mt-4 font-medium">Loading products...</p>
                        </div>
                    ) : products && products.data && products.data.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                            <p className="text-gray-600 mb-6">There are no products available in this category at the moment.</p>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                            >
                                Back to Home
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

