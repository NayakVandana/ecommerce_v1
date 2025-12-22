import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useCategoryStore } from './useCategoryStore';

export default function Index() {
    const [categories, setCategories] = useState<any>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await useCategoryStore.list();
            if (response.data?.status && response.data?.data) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">All Categories</h1>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Loading categories...</p>
                    </div>
                ) : categories && categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((category: any) => (
                            <Link
                                key={category.id}
                                href={`/categories/${category.slug}`}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                            >
                                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                                {category.description && (
                                    <p className="text-gray-600 mb-4">{category.description}</p>
                                )}
                                {category.products_count !== undefined && (
                                    <p className="text-sm text-gray-500">
                                        {category.products_count} {category.products_count === 1 ? 'product' : 'products'}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No categories found.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

