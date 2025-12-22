import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCategoryStore } from './useCategoryStore';
import { useProductStore } from '../Products/useProductStore';

export default function Show() {
    const { props } = usePage();
    const categorySlug = (props as any).slug;
    const [category, setCategory] = useState<any>(null);
    const [products, setProducts] = useState<any>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (categorySlug) {
            fetchData();
        }
    }, [categorySlug]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // First get category by slug (you may need to adjust this based on your API)
            // For now, assuming we can get category ID from slug
            const categoryRes = await useCategoryStore.list();
            const foundCategory = categoryRes.data?.data?.find((cat: any) => cat.slug === categorySlug);
            
            if (foundCategory) {
                setCategory(foundCategory);
                const categoryDetailRes = await useCategoryStore.show({ id: foundCategory.id });
                if (categoryDetailRes.data?.status && categoryDetailRes.data?.data) {
                    setCategory(categoryDetailRes.data.data);
                    setProducts(categoryDetailRes.data.data.products || []);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading category...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/categories" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
                    ← Back to Categories
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{category?.name || 'Category'}</h1>
                    {category?.description && (
                        <p className="text-gray-600">{category.description}</p>
                    )}
                </div>

                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product: any) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.id}`}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                            >
                                <div className="h-48 bg-gray-200 flex items-center justify-center">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400">No Image</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                                    <p className="text-indigo-600 font-bold">${product.price}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No products found in this category.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

