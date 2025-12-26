import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { useProductStore } from './useProductStore';
import { useCartStore } from '../Cart/useCartStore';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';

export default function Show() {
    const { props } = usePage();
    const productId = (props as any).id;
    const [product, setProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariation, setSelectedVariation] = useState<any>(null);
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
                // Dispatch event to update cart count in navigation
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    // Prepare images for react-image-gallery (must be before conditional returns)
    const galleryImages = useMemo(() => {
        if (!product?.media || product.media.length === 0) {
            return [{
                original: '/placeholder-image.png',
                thumbnail: '/placeholder-image.png',
                originalAlt: product?.product_name || 'Product',
                thumbnailAlt: product?.product_name || 'Product',
            }];
        }

        // Sort media by is_primary first, then by sort_order
        const sortedMedia = [...product.media].sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
        });

        // First available image to use as thumbnail fallback for videos/empties
        const fallbackImageUrl =
            sortedMedia.find((m: any) => m.type !== 'video')?.url ||
            sortedMedia.find((m: any) => m.type !== 'video')?.file_path ||
            '/placeholder-image.png';

        return sortedMedia.map((media: any) => {
            const isVideo = media.type === 'video';
            const mediaUrl = media.url || media.file_path || (isVideo ? '' : '/placeholder-image.png');
            const thumbnailUrl = isVideo
                ? fallbackImageUrl // use an image thumbnail for videos
                : mediaUrl || fallbackImageUrl;
            
            return {
                original: isVideo ? (mediaUrl || fallbackImageUrl) : (mediaUrl || fallbackImageUrl),
                thumbnail: thumbnailUrl,
                originalAlt: product.product_name,
                thumbnailAlt: product.product_name,
                description: media.color ? `Color: ${media.color}` : undefined,
                // Store media type for renderItem to use
                mediaType: media.type,
            };
        });
    }, [product]);

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

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="md:flex md:gap-8">
                        {/* Left Section - Image Gallery */}
                        <div className="md:w-2/5 lg:w-1/2 p-6">
                            <div className="sticky top-4">
                                <ImageGallery
                                    items={galleryImages}
                                    showPlayButton={false}
                                    showFullscreenButton={true}
                                    showThumbnails={galleryImages.length > 1}
                                    thumbnailPosition="bottom"
                                    lazyLoad={true}
                                    slideInterval={3000}
                                    slideDuration={450}
                                    showNav={true}
                                    showBullets={false}
                                    autoPlay={false}
                                    disableSwipe={false}
                                    useBrowserFullscreen={true}
                                    additionalClass="product-gallery"
                                    renderItem={(item: any) => {
                                        // Check if this is a video using the mediaType stored in the item
                                        if (item.mediaType === 'video') {
                                            return (
                                                <div className="image-gallery-image">
                                                    <video
                                                        src={item.original}
                                                        controls
                                                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                                                        style={{ maxHeight: '600px' }}
                                                        preload="metadata"
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            );
                                        }
                                        
                                        // Default image rendering
                                        return (
                                            <img
                                                src={item.original}
                                                alt={item.originalAlt || product.product_name}
                                                className="image-gallery-image"
                                            />
                                        );
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Right Section - Product Details */}
                        <div className="md:w-3/5 lg:w-1/2 p-6 md:p-8">
                            {/* Product Title */}
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.product_name}</h1>
                            
                            {/* Brand */}
                            {product.brand && (
                                <p className="text-gray-600 mb-2 text-base">Brand: <span className="font-medium">{product.brand}</span></p>
                            )}
                            
                            {/* SKU */}
                            {product.sku && (
                                <p className="text-xs text-gray-400 mb-6">SKU: {product.sku}</p>
                            )}
                            
                            {/* Price Section */}
                            <div className="mb-6">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <p className="text-3xl font-bold text-indigo-600">
                                        ${Number(product.final_price || product.price || 0).toFixed(2)}
                                    </p>
                                    {product.mrp && Number(product.mrp) > Number(product.final_price || product.price || 0) && (
                                        <>
                                            <p className="text-xl text-gray-400 line-through">${Number(product.mrp).toFixed(2)}</p>
                                            {product.discount_percent > 0 && (
                                                <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold">
                                                    {Number(product.discount_percent).toFixed(2)}% OFF
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                                {product.gst > 0 && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Inclusive of {product.gst}% GST
                                    </p>
                                )}
                            </div>
                            
                            {/* Description */}
                            <p className="text-gray-700 mb-8 leading-relaxed">{product.description}</p>
                            
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
                                    <h3 className="font-semibold text-gray-900 mb-3">Available Variations:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.variations.map((variation: any) => (
                                            <button
                                                key={variation.id}
                                                onClick={() => setSelectedVariation(variation)}
                                                className={`px-4 py-2.5 border-2 rounded-lg transition-all ${
                                                    selectedVariation?.id === variation.id
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                                                        : 'border-gray-300 hover:border-indigo-400 bg-white text-gray-700'
                                                }`}
                                            >
                                                {variation.size && <span className="mr-1">Size: {variation.size}</span>}
                                                {variation.color && <span className="mr-1">Color: {variation.color}</span>}
                                                <span className="text-xs text-gray-500 ml-1">
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

                            {/* Quantity Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Quantity</label>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold text-lg"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setQuantity(Math.max(1, val));
                                        }}
                                        className="w-20 px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-indigo-600"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold text-lg"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={addToCart}
                                disabled={addingToCart || (selectedVariation ? !selectedVariation.in_stock : (product.total_quantity !== null && product.total_quantity === 0))}
                                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                            >
                                {addingToCart ? 'Adding...' : 'Add to Cart'}
                            </button>
                            
                            {/* Hashtags */}
                            {product.hashtags && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">
                                        Tags: <span className="text-indigo-600">{product.hashtags}</span>
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

