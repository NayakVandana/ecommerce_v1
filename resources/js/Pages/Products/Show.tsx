import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useProductStore } from './useProductStore';
import { useCartStore } from '../Cart/useCartStore';

export default function Show() {
    const { props } = usePage();
    const productId = (props as any).id;
    const [product, setProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariation, setSelectedVariation] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await useProductStore.show({ id: productId });
            if (response.data?.status && response.data?.data) {
                const productData = response.data.data;
                setProduct(productData);
                
                // Set default selected image
                if (productData.media && productData.media.length > 0) {
                    const primaryImage = productData.media.find((m: any) => m.is_primary) || productData.media[0];
                    setSelectedImage(primaryImage);
                }
                
                // Set default variation if available
                if (productData.variations && productData.variations.length > 0) {
                    setSelectedVariation(productData.variations[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async () => {
        if (!product) return;
        
        // Check stock availability
        if (selectedVariation && selectedVariation.stock_quantity < quantity) {
            alert(`Only ${selectedVariation.stock_quantity} items available in stock`);
            return;
        }
        
        if (!selectedVariation && product.total_quantity !== null && product.total_quantity < quantity) {
            alert(`Only ${product.total_quantity} items available in stock`);
            return;
        }
        
        try {
            setAddingToCart(true);
            const response = await useCartStore.add({
                product_id: product.id,
                quantity: quantity,
                variation_id: selectedVariation?.id,
                size: selectedVariation?.size,
                color: selectedVariation?.color,
            });
            
            if (response.data?.status) {
                alert('Product added to cart successfully!');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading product...</p>
                </div>
            </AppLayout>
        );
    }

    if (!product) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Product not found</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link href="/products" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
                    ← Back to Products
                </Link>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/2">
                            {/* Main Image */}
                            <div className="h-96 bg-gray-200 flex items-center justify-center mb-4">
                                {selectedImage ? (
                                    <img 
                                        src={selectedImage.url || selectedImage.file_path} 
                                        alt={product.product_name} 
                                        className="h-full w-full object-cover" 
                                    />
                                ) : (
                                    <span className="text-gray-400">No Image</span>
                                )}
                            </div>
                            
                            {/* Image Gallery */}
                            {product.media && product.media.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.media.map((media: any) => (
                                        <button
                                            key={media.id}
                                            onClick={() => setSelectedImage(media)}
                                            className={`h-20 border-2 rounded overflow-hidden ${
                                                selectedImage?.id === media.id ? 'border-indigo-600' : 'border-gray-200'
                                            }`}
                                        >
                                            <img 
                                                src={media.url || media.file_path} 
                                                alt={product.product_name}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="md:w-1/2 p-8">
                            <h1 className="text-3xl font-bold mb-2">{product.product_name}</h1>
                            {product.brand && (
                                <p className="text-gray-500 mb-2">Brand: {product.brand}</p>
                            )}
                            {product.sku && (
                                <p className="text-xs text-gray-400 mb-4">SKU: {product.sku}</p>
                            )}
                            
                            {/* Price Section */}
                            <div className="mb-4">
                                <div className="flex items-center gap-3">
                                    <p className="text-3xl font-bold text-indigo-600">
                                        ${product.final_price || product.price}
                                    </p>
                                    {product.mrp && product.mrp > (product.final_price || product.price) && (
                                        <>
                                            <p className="text-xl text-gray-400 line-through">${product.mrp}</p>
                                            {product.discount_percent > 0 && (
                                                <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                                                    {product.discount_percent}% OFF
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                                {product.gst > 0 && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Inclusive of {product.gst}% GST
                                    </p>
                                )}
                            </div>
                            
                            <p className="text-gray-600 mb-6">{product.description}</p>
                            
                            {/* Features */}
                            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2">Features:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                        {product.features.map((feature: string, index: number) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* Variations */}
                            {product.variations && product.variations.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2">Available Variations:</h3>
                                    <div className="space-y-2">
                                        {product.variations.map((variation: any) => (
                                            <button
                                                key={variation.id}
                                                onClick={() => setSelectedVariation(variation)}
                                                className={`mr-2 px-4 py-2 border rounded ${
                                                    selectedVariation?.id === variation.id
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-gray-300 hover:border-indigo-400'
                                                }`}
                                            >
                                                {variation.size && <span>Size: {variation.size} </span>}
                                                {variation.color && <span>Color: {variation.color} </span>}
                                                <span className="text-xs text-gray-500">
                                                    ({variation.stock_quantity} in stock)
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Stock Status */}
                            <div className="mb-6">
                                {selectedVariation ? (
                                    <p className={`text-sm font-semibold ${
                                        selectedVariation.in_stock ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {selectedVariation.in_stock 
                                            ? `${selectedVariation.stock_quantity} items in stock`
                                            : 'Out of stock'
                                        }
                                    </p>
                                ) : product.total_quantity !== null ? (
                                    <p className={`text-sm font-semibold ${
                                        product.total_quantity > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {product.total_quantity > 0 
                                            ? `${product.total_quantity} items in stock`
                                            : 'Out of stock'
                                        }
                                    </p>
                                ) : null}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        -
                                    </button>
                                    <span className="text-lg font-semibold">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={addToCart}
                                disabled={addingToCart || (selectedVariation ? !selectedVariation.in_stock : (product.total_quantity !== null && product.total_quantity === 0))}
                                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addingToCart ? 'Adding...' : 'Add to Cart'}
                            </button>
                            
                            {/* Hashtags */}
                            {product.hashtags && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">
                                        Tags: {product.hashtags}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

