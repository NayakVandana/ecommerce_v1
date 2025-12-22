import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useProductStore } from './useProductStore';
import { useCategoryStore } from '../Categories/useCategoryStore';

export default function Index() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const selectedCategory = urlParams.get('category') || '';
    
    const [products, setProducts] = useState<any>(null);
    const [categories, setCategories] = useState<any>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                useProductStore.list({ category: selectedCategory || undefined }),
                useCategoryStore.list()
            ]);
            
            if (productsRes.data?.status && productsRes.data?.data) {
                setProducts(productsRes.data.data);
            }
            
            if (categoriesRes.data?.status && categoriesRes.data?.data) {
                setCategories(categoriesRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">All Products</h1>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <div className="w-full md:w-64">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>
                            <div className="space-y-2">
                                <Link
                                    href="/products"
                                    className={`block px-4 py-2 rounded ${!selectedCategory ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    All Categories
                                </Link>
                                {categories && categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products?category=${category.id}`}
                                        className={`block px-4 py-2 rounded ${selectedCategory === String(category.id) ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">Loading products...</p>
                            </div>
                        ) : products && products.data && products.data.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.data.map((product: any) => {
                                    const primaryImage = product.media?.find((m: any) => m.is_primary) || product.media?.[0];
                                    const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                    const displayPrice = product.final_price || product.price;
                                    const mrp = product.mrp;
                                    const discount = product.discount_percent;
                                    
                                    return (
                                        <Link
                                            key={product.id}
                                            href={`/products/${product.id}`}
                                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                                        >
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
                                            <div className="p-4">
                                                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.product_name}</h3>
                                                {product.brand && (
                                                    <p className="text-gray-500 text-xs mb-1">{product.brand}</p>
                                                )}
                                                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-indigo-600 font-bold">${displayPrice}</p>
                                                    {mrp && mrp > displayPrice && (
                                                        <>
                                                            <p className="text-gray-400 line-through text-sm">${mrp}</p>
                                                        </>
                                                    )}
                                                </div>
                                                {product.total_quantity !== null && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {product.total_quantity > 0 ? `${product.total_quantity} in stock` : 'Out of stock'}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No products found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

