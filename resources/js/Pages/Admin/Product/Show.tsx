import { useEffect, useState, useMemo } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { useProductStore } from './useProductStore';
import AdminLayout from '../Layout';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function ProductShow() {
    const { props } = usePage();
    const productId = (props as any).id;
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
                setProduct(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare images for react-image-gallery
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

        const fallbackImageUrl =
            sortedMedia.find((m: any) => m.type !== 'video')?.url ||
            sortedMedia.find((m: any) => m.type !== 'video')?.file_path ||
            '/placeholder-image.png';

        return sortedMedia.map((media: any) => {
            const isVideo = media.type === 'video';
            const mediaUrl = media.url || media.file_path || (isVideo ? '' : '/placeholder-image.png');
            const thumbnailUrl = isVideo
                ? fallbackImageUrl
                : mediaUrl || fallbackImageUrl;
            
            return {
                original: isVideo ? (mediaUrl || fallbackImageUrl) : (mediaUrl || fallbackImageUrl),
                thumbnail: thumbnailUrl,
                originalAlt: product.product_name,
                thumbnailAlt: product.product_name,
                description: media.color ? `Color: ${media.color}` : undefined,
                mediaType: media.type,
            };
        });
    }, [product]);

    if (loading) {
        return (
            <AdminLayout currentPath="/admin/products">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!product) {
        return (
            <AdminLayout currentPath="/admin/products">
                <div className="space-y-6">
                    {/* Back Button */}
                    <div>
                        <Link
                            href="/admin/products"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            Back to Products
                        </Link>
                    </div>
                    
                    <div className="bg-white shadow rounded-lg p-6">
                        <p className="text-center text-gray-500">Product not found</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentPath="/admin/products">
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <Link
                        href="/admin/products"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Back to Products
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
                        <p className="mt-1 text-sm text-gray-600">View full product information</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            product.is_approve === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {product.is_approve === 1 ? (
                                <>
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Approved
                                </>
                            ) : (
                                <>
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    Pending
                                </>
                            )}
                        </span>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="md:flex md:gap-8">
                        {/* Left Section - Image Gallery */}
                        <div className="md:w-2/5 lg:w-2/5 p-6">
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
                        <div className="md:w-3/5 lg:w-3/5 p-6 md:p-8">
                            {/* Product Title */}
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">{product.product_name}</h2>
                            
                            {/* Basic Information Card */}
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">SKU</p>
                                        <p className="text-base font-medium text-gray-900">{product.sku || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Brand</p>
                                        <p className="text-base font-medium text-gray-900">{product.brand || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Category</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {product.categoryRelation?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">HSN Code</p>
                                        <p className="text-base font-medium text-gray-900">{product.hsn_code || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Stock Quantity</p>
                                        <p className={`text-base font-medium ${
                                            (product.total_quantity || 0) > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {product.total_quantity || 0}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {product.is_approve === 1 ? 'Approved' : 'Pending Approval'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Information Card */}
                            <div className="bg-blue-50 rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Base Price</p>
                                        <p className="text-base font-medium text-gray-900">
                                            ${Number(product.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">MRP</p>
                                        <p className="text-base font-medium text-gray-900">
                                            ${Number(product.mrp || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Final Price</p>
                                        <p className="text-xl font-bold text-indigo-600">
                                            ${Number(product.final_price || product.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Discount</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {product.discount_percent ? `${Number(product.discount_percent).toFixed(2)}%` : '0%'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">GST</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {product.gst ? `${product.gst}%` : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total with GST</p>
                                        <p className="text-base font-medium text-gray-900">
                                            ${Number(product.total_with_gst || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Commission</p>
                                        <p className="text-base font-medium text-gray-900">
                                            ${Number(product.commission || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Commission GST</p>
                                        <p className="text-base font-medium text-gray-900">
                                            ${Number(product.commission_gst_amount || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {product.description || 'No description available'}
                                </p>
                            </div>
                            
                            {/* Features */}
                            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        {product.features.map((feature: string, index: number) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Hashtags */}
                            {product.hashtags && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                                    <p className="text-gray-700">{product.hashtags}</p>
                                </div>
                            )}

                            {/* Variations */}
                            {product.variations && product.variations.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Variations</h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Size
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Color
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Stock
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Price
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {product.variations.map((variation: any) => (
                                                    <tr key={variation.id}>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {variation.size || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {variation.color || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {variation.stock_quantity || 0}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            ${Number(variation.price || 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                variation.in_stock
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {variation.in_stock ? 'In Stock' : 'Out of Stock'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Media Information */}
                            {product.media && product.media.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Files</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {product.media.map((media: any, index: number) => (
                                            <div key={media.id || index} className="border rounded-lg p-2">
                                                {media.type === 'video' ? (
                                                    <video
                                                        src={media.url || media.file_path}
                                                        className="w-full h-24 object-cover rounded"
                                                        controls={false}
                                                    />
                                                ) : (
                                                    <img
                                                        src={media.url || media.file_path}
                                                        alt={`${product.product_name} - Media ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded"
                                                    />
                                                )}
                                                <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {media.type || 'image'} {media.is_primary && '(Primary)'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Product ID</p>
                                        <p className="font-medium text-gray-900">{product.id}</p>
                                    </div>
                                    {product.uuid && (
                                        <div>
                                            <p className="text-gray-500">UUID</p>
                                            <p className="font-medium text-gray-900">{product.uuid}</p>
                                        </div>
                                    )}
                                    {product.user_id && (
                                        <div>
                                            <p className="text-gray-500">User ID</p>
                                            <p className="font-medium text-gray-900">{product.user_id}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-500">Created At</p>
                                        <p className="font-medium text-gray-900">
                                            {product.created_at ? new Date(product.created_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Updated At</p>
                                        <p className="font-medium text-gray-900">
                                            {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

