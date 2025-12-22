import AppLayout from './Layouts/AppLayout';
import Container from '../Components/Container';
import Card from '../Components/Card';
import Button from '../Components/Button';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useProductStore } from './Products/useProductStore';
import { useCategoryStore } from './Categories/useCategoryStore';

export default function Home() {
    const [products, setProducts] = useState<any[]>([]);
    const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                useProductStore.list({}),
                useCategoryStore.list(),
            ]);

            if (productsRes.data?.status && productsRes.data?.data?.data) {
                // products is paginated; take first 8 for home
                setProducts(productsRes.data.data.data.slice(0, 8));
            }

            if (categoriesRes.data?.status && categoriesRes.data?.data) {
                const featured = categoriesRes.data.data.filter((cat: any) => cat.is_featured);
                setFeaturedCategories(featured.slice(0, 6));
            }
        } catch (error) {
            console.error('Error loading home data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Container className="py-8">
                {/* Hero Section */}
                <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-12 border-0 shadow-xl">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Our Ecommerce Store</h1>
                        <p className="text-xl mb-6">Discover amazing products at great prices</p>
                        <Button as="link" href="/products" variant="secondary" size="lg">
                            Shop Now
                        </Button>
                    </div>
                </Card>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* Featured Categories */}
                        {featuredCategories.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {featuredCategories.map((category) => (
                                        <Link key={category.id} href={`/categories/${category.slug}`}>
                                            <Card hover>
                                                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                                                <p className="text-gray-600">{category.description}</p>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Featured Products */}
                        {products.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {products.map((product: any) => {
                                        const primaryImage = product.media?.find((m: any) => m.is_primary) || product.media?.[0];
                                        const imageUrl = primaryImage?.url || primaryImage?.file_path || '';
                                        const displayPrice = product.final_price || product.price;
                                        const mrp = product.mrp;
                                        const discount = product.discount_percent;
                                        
                                        return (
                                            <Link key={product.id} href={`/products/${product.id}`}>
                                                <Card hover padding="none" className="overflow-hidden">
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
                                                                <p className="text-gray-400 line-through text-sm">${mrp}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </AppLayout>
    );
}

