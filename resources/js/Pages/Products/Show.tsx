import AppLayout from '../Layouts/AppLayout';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { useProductStore } from './useProductStore';
import { useCartStore } from '../Cart/useCartStore';
import { useWishlistStore } from '../Wishlist/useWishlistStore';
import toast from '../../utils/toast';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { HeartIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import DirectOrderModal from '../../Components/DirectOrderModal';
import ProductDetailSkeleton from '../../Components/Skeleton/ProductDetailSkeleton';

export default function Show() {
    const { props } = usePage();
    const productId = (props as any).id;
    const [product, setProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariation, setSelectedVariation] = useState<any>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedGender, setSelectedGender] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [togglingWishlist, setTogglingWishlist] = useState(false);
    const [showDirectOrderModal, setShowDirectOrderModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchProduct();
            checkWishlistStatus();
        }
        // Check if user is admin
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setIsAdmin(userData.role === 'admin');
            } catch (error) {
                setIsAdmin(false);
            }
        }
    }, [productId]);

    const checkWishlistStatus = async () => {
        if (!productId) return;
        try {
            const response = await useWishlistStore.check({ product_id: productId });
            if (response.data?.status) {
                setInWishlist(response.data.data?.in_wishlist || false);
            }
        } catch (error) {
            console.error('Error checking wishlist status:', error);
        }
    };

    const toggleWishlist = async () => {
        if (!productId) return;
        
        try {
            setTogglingWishlist(true);
            if (inWishlist) {
                const response = await useWishlistStore.remove({ product_id: productId });
                if (response.data?.status) {
                    setInWishlist(false);
                    toast({ type: 'success', message: 'Removed from wishlist' });
                    window.dispatchEvent(new Event('wishlistUpdated'));
                } else {
                    toast({ type: 'error', message: response.data?.message || 'Failed to remove from wishlist' });
                }
            } else {
                const response = await useWishlistStore.add({ product_id: productId });
                if (response.data?.status) {
                    setInWishlist(true);
                    toast({ type: 'success', message: 'Added to wishlist' });
                    window.dispatchEvent(new Event('wishlistUpdated'));
                } else {
                    toast({ type: 'error', message: response.data?.message || 'Failed to add to wishlist' });
                }
            }
        } catch (error: any) {
            console.error('Error toggling wishlist:', error);
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to update wishlist' });
        } finally {
            setTogglingWishlist(false);
        }
    };

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await useProductStore.show({ id: productId });
            if (response.data?.status && response.data?.data) {
                const productData = response.data.data;
                setProduct(productData);
                
                // Set default variation if available
                if (productData.variations && productData.variations.length > 0) {
                    const firstVariation = productData.variations[0];
                    setSelectedVariation(firstVariation);
                    setSelectedColor(firstVariation.color || null);
                    setSelectedSize(firstVariation.size || null);
                    setSelectedGender(firstVariation.gender || null);
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
            toast({ type: 'warning', message: `Only ${product.total_quantity} items available in stock` });
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
                // Dispatch event to update cart count in navigation
                window.dispatchEvent(new Event('cartUpdated'));
                // Open cart sidebar
                window.dispatchEvent(new Event('openCart'));
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast({ type: 'error', message: 'Failed to add product to cart' });
        } finally {
            setAddingToCart(false);
        }
    };

    // Helper function to get color hex value
    const getColorHex = (colorName: string): string => {
        const colorMap: { [key: string]: string } = {
            'red': '#D0021B',
            'blue': '#0000ff',
            'green': '#00ff00',
            'black': '#000000',
            'white': '#ffffff',
            'gray': '#808080',
            'grey': '#808080',
            'yellow': '#ffff00',
            'pink': '#ff1493',
            'purple': '#800080',
            'orange': '#ff9900',
            'brown': '#8b4513',
            'skyblue': '#87CEEB',
        };
        
        if (colorName.startsWith('#')) return colorName;
        return colorMap[colorName.toLowerCase()] || colorName;
    };

    // Get available colors with media information
    const availableColors = useMemo(() => {
        if (!product?.variations || !product?.media) return [];
        const colorMap = new Map<string, { color: string; hasMedia: boolean; mediaCount: number }>();
        
        product.variations.forEach((v: any) => {
            // Filter colors based on selected gender
            const genderMatch = !selectedGender || v.gender === selectedGender;
            if (v.color && genderMatch) {
                // Check if this color has media
                const colorMedia = product.media.filter((m: any) => {
                    if (m.variation_id) {
                        const variation = product.variations?.find((variation: any) => variation.id === m.variation_id);
                        return variation && variation.color === v.color;
                    }
                    return m.color === v.color;
                });
                
                if (!colorMap.has(v.color)) {
                    colorMap.set(v.color, {
                        color: v.color,
                        hasMedia: colorMedia.length > 0,
                        mediaCount: colorMedia.length
                    });
                }
            }
        });
        
        return Array.from(colorMap.values());
    }, [product, selectedGender]);

    // Helper functions to detect category type
    const isFootwearCategory = useMemo(() => {
        if (!product?.categoryRelation) return false;
        const category = product.categoryRelation;
        const categoryNameLower = category.name.toLowerCase();
        
        if (categoryNameLower === 'footwear') return true;
        
        // Check parent
        if (category.parent) {
            const parentNameLower = category.parent.name.toLowerCase();
            if (parentNameLower === 'footwear') return true;
        }
        
        return false;
    }, [product]);

    const isKidsFootwearCategory = useMemo(() => {
        if (!isFootwearCategory || !product?.categoryRelation) return false;
        const category = product.categoryRelation;
        
        // Check if parent is Boys, Girls, or Infants
        if (category.parent) {
            const parentNameLower = category.parent.name.toLowerCase();
            if (parentNameLower === 'boys' || parentNameLower === 'girls' || parentNameLower === 'infants') {
                return true;
            }
        }
        
        return false;
    }, [product, isFootwearCategory]);

    const isInfantFootwearCategory = useMemo(() => {
        if (!isKidsFootwearCategory || !product?.categoryRelation) return false;
        const category = product.categoryRelation;
        
        if (category.parent && category.parent.name.toLowerCase() === 'infants') {
            return true;
        }
        
        return false;
    }, [product, isKidsFootwearCategory]);

    const isFashionCategory = useMemo(() => {
        if (!product?.categoryRelation) return false;
        const category = product.categoryRelation;
        const categoryNameLower = category.name.toLowerCase();
        
        if (categoryNameLower === 'fashion') return true;
        
        // Check parent
        if (category.parent) {
            const parentNameLower = category.parent.name.toLowerCase();
            if (parentNameLower === 'fashion') return true;
        }
        
        return false;
    }, [product]);

    const isKidsFashionCategory = useMemo(() => {
        if (!isFashionCategory || !product?.categoryRelation) return false;
        const category = product.categoryRelation;
        
        // Check if parent is Boys, Girls, or Infants
        if (category.parent) {
            const parentNameLower = category.parent.name.toLowerCase();
            if (parentNameLower === 'boys' || parentNameLower === 'girls' || parentNameLower === 'infants') {
                return true;
            }
        }
        
        // Check grandparent (Fashion > Boys > Western Wear)
        if (category.parent && category.parent.parent) {
            const grandParentNameLower = category.parent.parent.name.toLowerCase();
            if (grandParentNameLower === 'boys' || grandParentNameLower === 'girls' || grandParentNameLower === 'infants') {
                return true;
            }
        }
        
        return false;
    }, [product, isFashionCategory]);

    const isInfantFashionCategory = useMemo(() => {
        if (!isKidsFashionCategory || !product?.categoryRelation) return false;
        const category = product.categoryRelation;
        
        if (category.parent && category.parent.name.toLowerCase() === 'infants') {
            return true;
        }
        
        if (category.parent && category.parent.parent && category.parent.parent.name.toLowerCase() === 'infants') {
            return true;
        }
        
        return false;
    }, [product, isKidsFashionCategory]);

    const isBottomwearCategory = useMemo(() => {
        if (!product?.categoryRelation) return false;
        const category = product.categoryRelation;
        const categoryNameLower = category.name.toLowerCase();
        
        const bottomwearCategories = ['jeans', 'trousers', 'casual trousers', 'formal trousers', 'shorts', 'track pants', 'skirts'];
        return bottomwearCategories.some(bw => categoryNameLower.includes(bw));
    }, [product]);

    const isMenBottomwearCategory = useMemo(() => {
        if (!isBottomwearCategory || !product?.categoryRelation) return false;
        const category = product.categoryRelation;
        
        // Check if parent is Men
        if (category.parent) {
            const parentNameLower = category.parent.name.toLowerCase();
            if (parentNameLower === 'men') {
                return true;
            }
            
            // Check grandparent (Fashion > Men > Western Wear > Jeans)
            if (category.parent.parent) {
                const grandParentNameLower = category.parent.parent.name.toLowerCase();
                if (grandParentNameLower === 'men') {
                    return true;
                }
            }
        }
        
        return false;
    }, [product, isBottomwearCategory]);

    const isBangleCategory = useMemo(() => {
        if (!product?.categoryRelation) return false;
        const category = product.categoryRelation;
        const categoryNameLower = category.name.toLowerCase();
        return categoryNameLower === 'bangle';
    }, [product]);

    const isRingCategory = useMemo(() => {
        if (!product?.categoryRelation) return false;
        const category = product.categoryRelation;
        const categoryNameLower = category.name.toLowerCase();
        return categoryNameLower === 'ring' || categoryNameLower.includes('ring');
    }, [product]);

    // Get all possible sizes from all variations (for display - shows all sizes)
    const allPossibleSizes = useMemo(() => {
        if (!product?.variations) return [];
        const sizes = new Set<string>();
        product.variations.forEach((v: any) => {
            if (v.size) sizes.add(v.size);
        });
        
        // Sort sizes based on category type
        const sizeArray = Array.from(sizes);
        
        if (isBangleCategory) {
            // Bangle sizes: numeric sorting (inches - 2.0, 2.25, 2.5, etc.)
            return sizeArray.sort((a, b) => {
                const numA = parseFloat(a) || 0;
                const numB = parseFloat(b) || 0;
                return numA - numB;
            });
        } else if (isRingCategory) {
            // Ring sizes: numeric sorting (4, 5, 6, 7, etc.)
            return sizeArray.sort((a, b) => {
                const numA = parseInt(a) || 0;
                const numB = parseInt(b) || 0;
                return numA - numB;
            });
        } else if (isFootwearCategory) {
            // Footwear sizes: numeric sorting
            if (isInfantFootwearCategory) {
                // Infant footwear: 1-5
                return sizeArray.sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                });
            } else if (isKidsFootwearCategory) {
                // Kids footwear: 1-13
                return sizeArray.sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                });
            } else {
                // Adult footwear: 6-12
                return sizeArray.sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                });
            }
        } else if (isFashionCategory) {
            if (isBottomwearCategory) {
                // Bottomwear sizes: numeric sorting (waist sizes)
                return sizeArray.sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                });
            } else if (isInfantFashionCategory) {
                // Infant fashion: age-based sizes
                const sizeOrder = ['0M-3M', '3M-6M', '6M-9M', '9M-12M', '12M-18M', '18M-24M', 'Newborn', '2T', '3T', '4T'];
                return sizeArray.sort((a, b) => {
                    const indexA = sizeOrder.indexOf(a);
                    const indexB = sizeOrder.indexOf(b);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.localeCompare(b);
                });
            } else if (isKidsFashionCategory) {
                // Kids fashion: age-based sizes
                const sizeOrder = ['0M-3M', '3M-6M', '6M-9M', '9M-12M', '12M-18M', '18M-24M', 'Newborn', '2Y-4Y', '4Y-6Y', '6Y-8Y', '8Y-10Y', '10Y-12Y', '12Y-14Y', '14Y+'];
                return sizeArray.sort((a, b) => {
                    const indexA = sizeOrder.indexOf(a);
                    const indexB = sizeOrder.indexOf(b);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.localeCompare(b);
                });
            } else {
                // Adult fashion: XS, S, M, L, XL, XXL, XXXL
                const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];
                return sizeArray.sort((a, b) => {
                    const indexA = sizeOrder.indexOf(a);
                    const indexB = sizeOrder.indexOf(b);
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    return a.localeCompare(b);
                });
            }
        } else {
            // Default: try to sort as adult fashion sizes
            const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];
            return sizeArray.sort((a, b) => {
                const indexA = sizeOrder.indexOf(a);
                const indexB = sizeOrder.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                // Try numeric sorting if not in size order
                const numA = parseInt(a) || 0;
                const numB = parseInt(b) || 0;
                if (numA > 0 && numB > 0) return numA - numB;
                return a.localeCompare(b);
            });
        }
    }, [product, isFootwearCategory, isKidsFootwearCategory, isInfantFootwearCategory, isFashionCategory, isKidsFashionCategory, isInfantFashionCategory]);

    // Check if a size is available for current selection (color + gender + in_stock)
    const isSizeAvailable = useMemo(() => {
        if (!product?.variations) return () => false;
        
        return (size: string): boolean => {
            return product.variations.some((v: any) => {
                const sizeMatch = v.size === size;
                const colorMatch = !selectedColor || v.color === selectedColor;
                const genderMatch = !selectedGender || v.gender === selectedGender;
                return sizeMatch && colorMatch && genderMatch && v.in_stock;
            });
        };
    }, [product, selectedColor, selectedGender]);

    const availableGenders = useMemo(() => {
        if (!product?.variations) return [];
        const genders = new Set<string>();
        product.variations.forEach((v: any) => {
            if (v.gender) genders.add(v.gender);
        });
        return Array.from(genders);
    }, [product]);

    // Find variation based on selected color, size, and gender
    useEffect(() => {
        if (!product?.variations) {
            return;
        }

        // If no selections made, set first available variation
        if (!selectedColor && !selectedSize && !selectedGender) {
            const firstAvailable = product.variations.find((v: any) => v.in_stock);
            if (firstAvailable) {
                setSelectedVariation(firstAvailable);
                setSelectedColor(firstAvailable.color || null);
                setSelectedSize(firstAvailable.size || null);
                setSelectedGender(firstAvailable.gender || null);
            }
            return;
        }

        // Try to find exact match first
        const matchingVariation = product.variations.find((v: any) => {
            const colorMatch = !selectedColor || v.color === selectedColor;
            const sizeMatch = !selectedSize || v.size === selectedSize;
            const genderMatch = !selectedGender || v.gender === selectedGender;
            return colorMatch && sizeMatch && genderMatch && v.in_stock;
        });

        if (matchingVariation) {
            setSelectedVariation(matchingVariation);
        } else {
            // If exact match not found, try to find closest match (color + gender, prefer in-stock)
            const partialMatch = product.variations.find((v: any) => {
                const colorMatch = !selectedColor || v.color === selectedColor;
                const genderMatch = !selectedGender || v.gender === selectedGender;
                return colorMatch && genderMatch && v.in_stock;
            }) || product.variations.find((v: any) => {
                // Fallback: just color match
                return (!selectedColor || v.color === selectedColor) && v.in_stock;
            });
            
            if (partialMatch) {
                setSelectedVariation(partialMatch);
                // Update size if not set or if current size is not available
                if (!selectedSize || !isSizeAvailable(selectedSize)) {
                    setSelectedSize(partialMatch.size || null);
                }
            } else if (selectedColor) {
                // If only color is selected, find any variation with that color for media display
                const colorVariation = product.variations.find((v: any) => v.color === selectedColor);
                if (colorVariation) {
                    setSelectedVariation(colorVariation);
                    setSelectedSize(colorVariation.size || null);
                    setSelectedGender(colorVariation.gender || null);
                }
            }
        }
    }, [selectedColor, selectedSize, selectedGender, product, isSizeAvailable]);

    // Prepare images for react-image-gallery - filter by selected variation
    const galleryImages = useMemo(() => {
        if (!product?.media || product.media.length === 0) {
            return [{
                original: '/placeholder-image.png',
                thumbnail: '/placeholder-image.png',
                originalAlt: product?.product_name || 'Product',
                thumbnailAlt: product?.product_name || 'Product',
            }];
        }

        let filteredMedia: any[] = [];
        
        if (selectedVariation?.id) {
            // Priority 1: Media linked to the exact selected variation
            const exactVariationMedia = product.media.filter((m: any) => m.variation_id === selectedVariation.id);
            
            // Priority 2: Media linked to variations with the same color (if exact variation has no media)
            let sameColorMedia: any[] = [];
            if (exactVariationMedia.length === 0 && selectedVariation.color) {
                sameColorMedia = product.media.filter((m: any) => {
                    if (!m.variation_id) return false;
                    const variation = product.variations?.find((v: any) => v.id === m.variation_id);
                    return variation && variation.color === selectedVariation.color;
                });
            }
            
            // Priority 3: General media (not linked to any variation)
            const generalMedia = product.media.filter((m: any) => !m.variation_id);
            
            // Combine: exact variation media > same color media > general media
            filteredMedia = [...exactVariationMedia, ...sameColorMedia, ...generalMedia];
        } else if (selectedColor) {
            // If only color is selected (no exact variation), show media for that color
            // Priority: Media linked to variations with this color > Media with matching color field > General media
            const colorVariationMedia = product.media.filter((m: any) => {
                if (!m.variation_id) return false;
                const variation = product.variations?.find((v: any) => v.id === m.variation_id);
                return variation && variation.color === selectedColor;
            });
            
            // Also include media that has matching color field (for backward compatibility)
            const colorFieldMedia = product.media.filter((m: any) => {
                return !m.variation_id && m.color === selectedColor;
            });
            
            const generalMedia = product.media.filter((m: any) => {
                return !m.variation_id && m.color !== selectedColor;
            });
            
            filteredMedia = [...colorVariationMedia, ...colorFieldMedia, ...generalMedia];
        } else {
            // Show only general media (not linked to any variation)
            filteredMedia = product.media.filter((m: any) => !m.variation_id);
        }

        // If no media found, show all media as fallback
        if (filteredMedia.length === 0) {
            filteredMedia = product.media;
        }

        // Sort media by is_primary first, then by sort_order
        const sortedMedia = [...filteredMedia].sort((a: any, b: any) => {
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
            const mediaUrl = media.url || (media.file_path ? `/storage/${media.file_path}` : '') || (isVideo ? '' : '/placeholder-image.png');
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
    }, [product, selectedVariation, selectedColor]);

    if (loading) {
        return (
            <AppLayout>
                <ProductDetailSkeleton />
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
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                <Link href="/categories" className="text-indigo-600 hover:text-indigo-800 mb-3 sm:mb-4 inline-block text-sm sm:text-base">
                    ← Back to Products
                </Link>

                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="md:flex md:gap-8">
                        {/* Left Section - Image Gallery */}
                        <div className="md:w-2/5 lg:w-1/2 p-3 sm:p-4 md:p-6">
                            <div className="md:sticky md:top-4">
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
                                    thumbnailClass="image-gallery-thumbnail"
                                    slideClass="image-gallery-slide"
                                    renderItem={(item: any) => {
                                        // Check if this is a video using the mediaType stored in the item
                                        if (item.mediaType === 'video') {
                                            return (
                                                <div className="image-gallery-image">
                                                    <video
                                                        src={item.original}
                                                        controls
                                                        className="w-full h-auto max-h-[300px] sm:max-h-[400px] md:max-h-[600px] object-contain mx-auto"
                                                        style={{ maxHeight: '300px' }}
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
                                                className="image-gallery-image w-full h-auto"
                                                style={{ maxHeight: '600px', objectFit: 'contain' }}
                                            />
                                        );
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Right Section - Product Details */}
                        <div className="md:w-3/5 lg:w-1/2 p-3 sm:p-4 md:p-6 lg:p-8">
                            {/* Product Title */}
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{product.product_name}</h1>
                             {/* Description */}
                            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 md:mb-8 leading-relaxed">{product.description}</p>
                                {/* Fabrics - Only for Fashion Category */}
                            {(() => {
                                // Check if category is Fashion or has Fashion as parent
                                const category = product.categoryRelation;
                                let isFashion = false;
                                
                                if (category) {
                                    // Check if category name is Fashion (case-insensitive)
                                    if (category.name.toLowerCase() === 'fashion') {
                                        isFashion = true;
                                    }
                                    // Also check if parent category is Fashion (for subcategories)
                                    // Note: parent might not be loaded, so we check parent_id
                                    // The API should load parent if needed, but we'll handle both cases
                                    else if (category.parent_id) {
                                        // If parent is loaded, check it
                                        if (category.parent && category.parent.name.toLowerCase() === 'fashion') {
                                            isFashion = true;
                                        }
                                        // If parent is not loaded but we have parent_id, we can't check it here
                                        // In that case, we'll rely on the backend to only return fabrics for fashion products
                                    }
                                }
                                
                                // Show fabrics if it's fashion category and fabrics exist
                                // Also show if fabrics exist (backend should only return for fashion)
                                return (isFashion || (product.fabrics && product.fabrics.length > 0)) && product.fabrics && product.fabrics.length > 0 ? (
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-3">Available Fabrics</h3>
                                        <div className="space-y-3">
                                            {product.fabrics.map((fabric: any, index: number) => (
                                                <div key={fabric.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900 mb-1">{fabric.fabric_name}</h4>
                                                            {fabric.description && (
                                                                <p className="text-sm text-gray-600">{fabric.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                            
                            {/* Brand */}
                            {product.brand && (
                                <p className="text-gray-600 mb-2 text-sm sm:text-base">Brand: <span className="font-medium">{product.brand}</span></p>
                            )}
                            
                            {/* SKU */}
                            {product.sku && (
                                <p className="text-[10px] sm:text-xs text-gray-400 mb-4 sm:mb-6">SKU: {product.sku}</p>
                            )}
                            
                            {/* Price Section */}
                            <div className="mb-4 sm:mb-6">
                                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                    <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
                                        ₹{Number(product.final_price || product.price || 0).toFixed(2)}
                                    </p>
                                    {product.mrp && Number(product.mrp) > Number(product.final_price || product.price || 0) && (
                                        <>
                                            <p className="text-lg sm:text-xl text-gray-400 line-through">₹{Number(product.mrp).toFixed(2)}</p>
                                            {product.discount_percent > 0 && (
                                                <span className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-md text-xs sm:text-sm font-bold">
                                                    {Number(product.discount_percent).toFixed(2)}% OFF
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                                {product.gst > 0 && (
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                                        Inclusive of {product.gst}% GST
                                    </p>
                                )}
                            </div>

                            {/* Expected Delivery Date */}
                            <div className="mb-4 sm:mb-6 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                                            Expected Delivery Date
                                        </p>
                                        <p className="text-xs sm:text-sm text-blue-800">
                                            {(() => {
                                                // Calculate default delivery date: tomorrow
                                                const deliveryDate = new Date();
                                                deliveryDate.setDate(deliveryDate.getDate() + 1);
                                                return deliveryDate.toLocaleDateString('en-US', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                });
                                            })()}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                                            Orders placed today will be delivered by this date
                                        </p>
                                    </div>
                                </div>
                            </div>

                            
                            
                            {/* Return/Refund Policy - Only show if returnable */}
                            {product.is_returnable === true && (
                                <div className="mb-4">
                                    <div className="flex items-start gap-2">
                                        <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 mb-1">Returnable & Refundable</p>
                                            <p className="text-xs text-gray-600">
                                                This product is eligible for return/refund within 7 days of delivery.
                                            </p>
                                            {product.return_policy_note && (
                                                <p className="text-xs text-gray-600 mt-1 italic">Note: {product.return_policy_note}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Replacement Policy - Only show if replaceable */}
                            {product.is_replaceable === true && (
                                <div className="mb-6">
                                    <div className="flex items-start gap-2">
                                        <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 mb-1">Replaceable</p>
                                            <p className="text-xs text-gray-600">
                                                This product is eligible for replacement within 7 days of delivery if defective or damaged.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                           
                            
                            {/* Features */}
                            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="font-semibold text-sm sm:text-base mb-2">Features:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600">
                                        {product.features.map((feature: string, index: number) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        
                            {/* Gender Selection (for fashion products) */}
                            {availableGenders.length > 0 && (
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Gender</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableGenders.map((gender: string) => (
                                            <button
                                                key={gender}
                                                onClick={() => setSelectedGender(gender)}
                                                className={`px-3 py-1.5 sm:px-4 sm:py-2 border-2 rounded-lg transition-all capitalize text-sm sm:text-base ${
                                                    selectedGender === gender
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                                                        : 'border-gray-300 hover:border-indigo-400 bg-white text-gray-700'
                                                }`}
                                            >
                                                {gender}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Color Selection with Media Preview */}
                            {availableColors.length > 0 && (
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Color</h3>
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {availableColors.map((colorInfo: any) => {
                                            const colorValue = getColorHex(colorInfo.color);
                                            const isSelected = selectedColor === colorInfo.color;
                                            
                                            // Get preview image for this color
                                            const colorPreviewMedia = product.media?.find((m: any) => {
                                                if (m.variation_id) {
                                                    const variation = product.variations?.find((v: any) => v.id === m.variation_id);
                                                    return variation && variation.color === colorInfo.color && m.type === 'image';
                                                }
                                                return m.color === colorInfo.color && m.type === 'image';
                                            });
                                            
                                            return (
                                                <div key={colorInfo.color} className="relative group">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedColor(colorInfo.color);
                                                            // Auto-select first available size for this color
                                                            if (!selectedSize || !isSizeAvailable(selectedSize)) {
                                                                const availableSize = allPossibleSizes.find(size => {
                                                                    return product.variations?.some((v: any) => {
                                                                        const colorMatch = v.color === colorInfo.color;
                                                                        const genderMatch = !selectedGender || v.gender === selectedGender;
                                                                        return v.size === size && colorMatch && genderMatch && v.in_stock;
                                                                    });
                                                                });
                                                                if (availableSize) {
                                                                    setSelectedSize(availableSize);
                                                                }
                                                            }
                                                        }}
                                                        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 transition-all ${
                                                            isSelected
                                                                ? 'border-indigo-600 ring-2 ring-indigo-300 scale-110 shadow-lg'
                                                                : 'border-gray-300 hover:border-indigo-400 hover:scale-105'
                                                        }`}
                                                        style={{ backgroundColor: colorValue }}
                                                        title={`${colorInfo.color}${colorInfo.hasMedia ? ` (${colorInfo.mediaCount} images)` : ''}`}
                                                    >
                                                        {colorInfo.hasMedia && (
                                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                                <span className="text-white text-xs">✓</span>
                                                            </span>
                                                        )}
                                                    </button>
                                                    {/* Preview tooltip on hover */}
                                                    {colorPreviewMedia && (
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                            <div className="bg-white rounded-lg shadow-xl p-2 border border-gray-200">
                                                                <img
                                                                    src={colorPreviewMedia.url || (colorPreviewMedia.file_path ? `/storage/${colorPreviewMedia.file_path}` : '/placeholder-image.png')}
                                                                    alt={colorInfo.color}
                                                                    className="w-24 h-24 object-cover rounded"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                                    }}
                                                                />
                                                                <p className="text-xs text-center mt-1 font-medium capitalize">{colorInfo.color}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Size Selection */}
                            {allPossibleSizes.length > 0 && (
                                <div className="mb-4 sm:mb-6">
                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Size</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {allPossibleSizes.map((size: string) => {
                                            const isSelected = selectedSize === size;
                                            const isAvailable = isSizeAvailable(size);
                                            
                                            return (
                                                <button
                                                    key={size}
                                                    onClick={() => {
                                                        if (isAvailable) {
                                                            setSelectedSize(size);
                                                        }
                                                    }}
                                                    disabled={!isAvailable}
                                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 border-2 rounded-lg transition-all text-sm sm:text-base ${
                                                        isSelected
                                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                                                            : isAvailable
                                                            ? 'border-gray-300 hover:border-indigo-400 bg-white text-gray-700 cursor-pointer'
                                                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                                                    }`}
                                                    title={!isAvailable ? 'Size not available for selected color/gender combination' : `Select size ${size}`}
                                                >
                                                    {size}
                                                    {!isAvailable && (
                                                        <span className="ml-1 text-[10px] sm:text-xs opacity-75">(Unavailable)</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedSize && (
                                        <p className="text-xs sm:text-sm text-gray-600 mt-2">
                                            Selected: <span className="font-medium">{selectedSize}</span>
                                            {!isSizeAvailable(selectedSize) && (
                                                <span className="ml-2 text-red-600 text-[10px] sm:text-xs">(Currently unavailable)</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            {/* Stock Status */}
                            <div className="mb-4 sm:mb-6">
                                {selectedVariation ? (
                                    <p className={`text-xs sm:text-sm font-semibold ${
                                        selectedVariation.in_stock ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {selectedVariation.in_stock 
                                            ? `${selectedVariation.stock_quantity} items in stock`
                                            : 'Out of stock'
                                        }
                                    </p>
                                ) : product.total_quantity !== null ? (
                                    <p className={`text-xs sm:text-sm font-semibold ${
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
                            <div className="mb-4 sm:mb-6">
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Quantity</label>
                                <div className="flex items-center space-x-3 sm:space-x-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-2 sm:px-4 sm:py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold text-base sm:text-lg"
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
                                        className="w-16 sm:w-20 px-2 sm:px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-base sm:text-lg font-semibold focus:outline-none focus:border-indigo-600"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-3 py-2 sm:px-4 sm:py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold text-base sm:text-lg"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart and Wishlist Buttons */}
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={addToCart}
                                    disabled={addingToCart || (selectedVariation ? !selectedVariation.in_stock : (product.total_quantity !== null && product.total_quantity === 0))}
                                    className="flex-1 bg-indigo-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    {addingToCart ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                                            <span className="hidden sm:inline">Adding...</span>
                                            <span className="sm:hidden">...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCartIcon className="h-5 w-5 sm:hidden" />
                                            <span className="hidden sm:inline">Add to Cart</span>
                                            <span className="sm:hidden">ADD</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={toggleWishlist}
                                    disabled={togglingWishlist}
                                    className={`px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center ${
                                        inWishlist
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    {togglingWishlist ? (
                                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-current"></div>
                                    ) : inWishlist ? (
                                        <HeartIconSolid className="h-5 w-5 sm:h-6 sm:w-6" />
                                    ) : (
                                        <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    )}
                                </button>
                            </div>

                            {/* Direct Order Button (Admin Only) */}
                            {isAdmin && (
                                <div className="mt-3 sm:mt-4">
                                    <button
                                        onClick={() => setShowDirectOrderModal(true)}
                                        disabled={selectedVariation ? !selectedVariation.in_stock : (product.total_quantity !== null && product.total_quantity === 0)}
                                        className="w-full bg-green-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="hidden sm:inline">Create Direct Order</span>
                                        <span className="sm:hidden">Direct Order</span>
                                    </button>
                                </div>
                            )}
                            
                            {/* Hashtags */}
                            {product.hashtags && (
                                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        Tags: <span className="text-indigo-600">{product.hashtags}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </div>
            </div>

            {/* Direct Order Modal */}
            {isAdmin && (
                <DirectOrderModal
                    isOpen={showDirectOrderModal}
                    onClose={() => setShowDirectOrderModal(false)}
                    product={product}
                    selectedVariation={selectedVariation}
                    quantity={quantity}
                    onSuccess={() => {
                        setShowDirectOrderModal(false);
                    }}
                />
            )}
        </AppLayout>
    );
}

