import { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useProductStore } from './useProductStore';
import { useCategoryStore } from '../Category/useCategoryStore';
import AdminLayout from '../Layout';
import toast from '../../../utils/toast';
import { ArrowLeftIcon, XMarkIcon, PlusIcon, TrashIcon, VideoCameraIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';
import { SketchPicker } from 'react-color';

export default function ProductCreate() {
    const { props } = usePage();
    const productId = (props as any).id;
    const isEditMode = !!productId;
    
    const [categories, setCategories] = useState<any[]>([]);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        product_name: '',
        description: '',
        price: '',
        category: '',
        total_quantity: '',
        is_approve: 0,
    });
    const [errors, setErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [media, setMedia] = useState<any[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [variations, setVariations] = useState<any[]>([]);
    const [mediaColor, setMediaColor] = useState('');
    const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [mediaColorPickers, setMediaColorPickers] = useState<{ [key: number]: boolean }>({});
    const [variationColorPickers, setVariationColorPickers] = useState<{ [key: number]: boolean }>({});
    const [variationColors, setVariationColors] = useState<{ [key: number]: string }>({});
    const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video'>('images');
    const [pendingImages, setPendingImages] = useState<File[]>([]);
    const [pendingVideos, setPendingVideos] = useState<File[]>([]);

    useEffect(() => {
        loadCategories();
        if (isEditMode && productId) {
            loadProduct();
        }
    }, [productId]);

    useEffect(() => {
        if (product) {
            setFormData({
                product_name: product.product_name || '',
                description: product.description || '',
                price: product.price || '',
                category: product.category || '',
                total_quantity: product.total_quantity || '',
                is_approve: product.is_approve || 0,
            });
            setMedia(product.media || []);
            setVariations(product.variations || []);
        }
    }, [product]);

    const loadCategories = async () => {
        try {
            const response = await useCategoryStore.list();
            if (response.data?.status) {
                setCategories(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadProduct = async () => {
        try {
            setLoading(true);
            const response = await useProductStore.show({ id: productId });
            if (response.data?.status && response.data?.data) {
                setProduct(response.data.data);
            }
        } catch (error) {
            console.error('Error loading product:', error);
            toast({ message: 'Failed to load product', type: 'error' });
            router.visit('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const currentProductId = productId || (product?.id);
        
        // Separate images and videos
        const images = acceptedFiles.filter(file => file.type.startsWith('image/'));
        const videos = acceptedFiles.filter(file => file.type.startsWith('video/'));
        
        // If product exists, upload immediately
        if (currentProductId) {
            uploadMediaFiles(acceptedFiles, currentProductId);
        } else {
            // Store files for later upload after product creation
            setPendingMediaFiles([...pendingMediaFiles, ...acceptedFiles]);
            setPendingImages([...pendingImages, ...images]);
            setPendingVideos([...pendingVideos, ...videos]);
            toast({ message: `${acceptedFiles.length} file(s) selected. They will be uploaded after product is created.`, type: 'info' });
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.mov', '.avi']
        },
        multiple: true
    });

    const uploadMediaFiles = async (files: File[], productIdToUse: number) => {
        try {
            setUploadingMedia(true);
            const formData = new FormData();
            formData.append('product_id', productIdToUse.toString());
            if (mediaColor) {
                formData.append('color', mediaColor);
            }
            
            files.forEach((file) => {
                formData.append('files[]', file);
            });

            const response = await useProductStore.uploadMedia(formData);
            if (response.data?.status) {
                const uploadedMedia = response.data.data;
                // If no media exists yet, set first one as primary
                if (media.length === 0 && uploadedMedia.length > 0) {
                    // First uploaded media is automatically set as primary by backend
                    // But we can ensure it's marked in our state
                    uploadedMedia[0].is_primary = true;
                }
                setMedia([...media, ...uploadedMedia]);
                setMediaColor('');
                toast({ message: 'Media uploaded successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error uploading media:', error);
            toast({ message: error.response?.data?.message || 'Failed to upload media', type: 'error' });
        } finally {
            setUploadingMedia(false);
        }
    };

    const uploadPendingMedia = async (savedProductId: number) => {
        if (pendingMediaFiles.length > 0 && savedProductId) {
            const formData = new FormData();
            formData.append('product_id', savedProductId.toString());
            if (mediaColor) {
                formData.append('color', mediaColor);
            }
            
            pendingMediaFiles.forEach((file) => {
                formData.append('files[]', file);
            });

            const response = await useProductStore.uploadMedia(formData);
            if (response.data?.status) {
                // Clear pending files after successful upload
                setPendingMediaFiles([]);
                setPendingImages([]);
                setPendingVideos([]);
                setMediaColor('');
                return true;
            }
            throw new Error('Failed to upload media');
        }
        return true;
    };

    const removePendingFile = (file: File, type: 'image' | 'video') => {
        if (type === 'image') {
            setPendingImages(pendingImages.filter(f => f !== file));
        } else {
            setPendingVideos(pendingVideos.filter(f => f !== file));
        }
        setPendingMediaFiles(pendingMediaFiles.filter(f => f !== file));
    };

    const handleUpdateMediaColor = async (mediaId: number, color: string) => {
        try {
            const response = await useProductStore.updateMedia({ id: mediaId, color });
            if (response.data?.status) {
                setMedia(media.map((m: any) => m.id === mediaId ? { ...m, color } : m));
                toast({ message: 'Media color updated successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error updating media color:', error);
            toast({ message: 'Failed to update media color', type: 'error' });
        }
    };

    const handleSetPrimaryMedia = async (mediaId: number) => {
        try {
            const response = await useProductStore.updateMedia({ id: mediaId, is_primary: true });
            if (response.data?.status) {
                // Update local state: set the selected one as primary, others as not primary
                setMedia(media.map((m: any) => ({
                    ...m,
                    is_primary: m.id === mediaId ? true : false
                })));
                toast({ message: 'Primary media updated successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error setting primary media:', error);
            toast({ message: 'Failed to set primary media', type: 'error' });
        }
    };

    const handleDeleteMedia = async (mediaId: number) => {
        if (!confirm('Are you sure you want to delete this media?')) return;

        try {
            const response = await useProductStore.deleteMedia({ id: mediaId });
            if (response.data?.status) {
                setMedia(media.filter((m: any) => m.id !== mediaId));
                toast({ message: 'Media deleted successfully', type: 'success' });
            }
        } catch (error: any) {
            console.error('Error deleting media:', error);
            toast({ message: 'Failed to delete media', type: 'error' });
        }
    };

    const handleAddVariation = () => {
        const newVariation = {
            id: null,
            size: '',
            color: '',
            stock_quantity: 0,
            in_stock: true,
        };
        const updated = [...variations, newVariation];
        setVariations(updated);
        
        // Auto-calculate total stock from variations
        const totalStock = updated.reduce((sum, v) => {
            return sum + (parseInt(v.stock_quantity) || 0);
        }, 0);
        setFormData(prev => ({
            ...prev,
            total_quantity: totalStock.toString()
        }));
    };

    const handleRemoveVariation = (index: number) => {
        const updated = variations.filter((_, i) => i !== index);
        setVariations(updated);
        
        // Recalculate total stock after removal
        if (updated.length > 0) {
            const totalStock = updated.reduce((sum, v) => {
                return sum + (parseInt(v.stock_quantity) || 0);
            }, 0);
            setFormData(prev => ({
                ...prev,
                total_quantity: totalStock.toString()
            }));
        } else {
            // If no variations, allow manual input
            setFormData(prev => ({
                ...prev,
                total_quantity: prev.total_quantity || '0'
            }));
        }
    };

    const handleVariationChange = (index: number, field: string, value: any) => {
        const updated = [...variations];
        updated[index] = { ...updated[index], [field]: value };
        setVariations(updated);
        
        // Auto-calculate total stock from variations if they exist
        if (variations.length > 0) {
            const totalStock = updated.reduce((sum, v) => {
                return sum + (parseInt(v.stock_quantity) || 0);
            }, 0);
            setFormData(prev => ({
                ...prev,
                total_quantity: totalStock.toString()
            }));
        }
    };

    const handleColorChange = (color: any) => {
        setMediaColor(color.hex);
    };

    const handleVariationColorChange = (index: number, color: any) => {
        setVariationColors({ ...variationColors, [index]: color.hex });
        handleVariationChange(index, 'color', color.hex);
        setVariationColorPickers({ ...variationColorPickers, [index]: false });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const submitData: any = {
                ...formData,
                price: parseFloat(formData.price),
                category: parseInt(formData.category),
                total_quantity: parseInt(formData.total_quantity),
                is_approve: formData.is_approve,
                variations: variations.map((v: any) => ({
                    size: v.size || null,
                    color: v.color || null,
                    stock_quantity: parseInt(v.stock_quantity) || 0,
                    in_stock: v.in_stock !== false,
                })),
            };

            if (isEditMode) {
                submitData.id = productId;
            }

            const response = isEditMode 
                ? await useProductStore.update(submitData)
                : await useProductStore.store(submitData);

            if (response.data?.status) {
                const savedProductId = response.data.data.id || productId;
                
                // Upload pending media files if any (for new products)
                if (!isEditMode && savedProductId && pendingMediaFiles.length > 0) {
                    try {
                        await uploadPendingMedia(savedProductId);
                        toast({ message: 'Product created and media uploaded successfully.', type: 'success' });
                    } catch (error) {
                        console.error('Error uploading pending media:', error);
                        toast({ message: 'Product created but some media failed to upload.', type: 'warning' });
                    }
                } else {
                    toast({ message: isEditMode ? 'Product updated successfully' : 'Product created successfully.', type: 'success' });
                }
                
                // Small delay to ensure media upload completes
                setTimeout(() => {
                    // Redirect to product listing page after successful save
                    router.visit('/admin/products');
                }, 500);
            } else {
                if (response.data?.errors) {
                    setErrors(response.data.errors);
                } else if (response.data?.message) {
                    setErrors({ general: response.data.message });
                }
            }
        } catch (error: any) {
            console.error('Error saving product:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else {
                setErrors({ general: 'An error occurred while saving the product' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (isEditMode && loading) {
        return (
            <AdminLayout currentPath="/admin/products">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout currentPath="/admin/products">
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <button
                        onClick={() => router.visit('/admin/products')}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Back to Products
                    </button>
                </div>

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        {isEditMode ? 'Update product information' : 'Create a new product for your catalog'}
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white shadow rounded-lg">
                    <form onSubmit={handleSubmit} className="p-6">
                        {errors.general && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{errors.general}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="product_name"
                                    value={formData.product_name}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        errors.product_name ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter product name"
                                />
                                {errors.product_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    rows={6}
                                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        errors.description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter product description"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* Category and Price Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.category ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category: any) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                                    )}
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Price <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.price ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="0.00"
                                    />
                                    {errors.price && (
                                        <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                                    )}
                                </div>
                            </div>

                            {/* Approval Status */}
                            <div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_approve"
                                        id="is_approve"
                                        checked={formData.is_approve === 1}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_approve" className="ml-2 block text-sm text-gray-900">
                                        Approve Product
                                    </label>
                                </div>
                            </div>

                            {/* Product Media Section */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Media</h3>
                                    {/* Media Upload Tabs */}
                                    <div className="mb-4">
                                        <div className="border-b border-gray-200">
                                            <nav className="flex space-x-8">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMediaTab('images')}
                                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                        activeMediaTab === 'images'
                                                            ? 'border-indigo-500 text-indigo-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    IMAGES
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveMediaTab('video')}
                                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                        activeMediaTab === 'video'
                                                            ? 'border-indigo-500 text-indigo-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    VIDEO
                                                </button>
                                            </nav>
                                        </div>

                                        {/* Upload Area */}
                                        <div className="mt-4">
                                            <div
                                                {...getRootProps()}
                                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                                    isDragActive
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                                                } ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <input {...getInputProps()} disabled={uploadingMedia} />
                                                <div className="space-y-2">
                                                    {activeMediaTab === 'images' ? (
                                                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                    ) : (
                                                        <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                    )}
                                                    {isDragActive ? (
                                                        <p className="text-sm text-indigo-600 font-medium">Drop the files here...</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-gray-600">
                                                                <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop your {activeMediaTab === 'images' ? 'image' : 'video'} here
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {activeMediaTab === 'images' 
                                                                    ? 'Images (JPEG, PNG, GIF, WEBP)'
                                                                    : 'Videos (MP4, MOV, AVI)'
                                                                }
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pending Images Preview */}
                                            {activeMediaTab === 'images' && (pendingImages.length > 0 || media.filter((m: any) => m.type === 'image').length > 0) && (
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {/* Pending Images */}
                                                    {pendingImages.map((file, index) => (
                                                        <div key={`pending-${index}`} className="relative group">
                                                            <img
                                                                src={URL.createObjectURL(file)}
                                                                alt={`Preview ${index}`}
                                                                className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removePendingFile(file, 'image')}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Uploaded Images */}
                                                    {media.filter((m: any) => m.type === 'image').map((item: any) => (
                                                        <div key={item.id} className="relative group">
                                                            <img
                                                                src={item.url || item.file_path}
                                                                alt={item.file_name}
                                                                className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                            />
                                                            {item.is_primary && (
                                                                <span className="absolute top-1 left-1 px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded">
                                                                    Primary
                                                                </span>
                                                            )}
                                                            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrimaryMedia(item.id)}
                                                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                                                        item.is_primary
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                                                                    }`}
                                                                    title="Set as Primary"
                                                                >
                                                                    {item.is_primary ? 'Primary' : 'Set Primary'}
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteMedia(item.id)}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Pending Videos Preview */}
                                            {activeMediaTab === 'video' && (pendingVideos.length > 0 || media.filter((m: any) => m.type === 'video').length > 0) && (
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {/* Pending Videos */}
                                                    {pendingVideos.map((file, index) => (
                                                        <div key={`pending-video-${index}`} className="relative group">
                                                            <video
                                                                src={URL.createObjectURL(file)}
                                                                className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                                controls
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removePendingFile(file, 'video')}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Uploaded Videos */}
                                                    {media.filter((m: any) => m.type === 'video').map((item: any) => (
                                                        <div key={item.id} className="relative group">
                                                            <video
                                                                src={item.url || item.file_path}
                                                                className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                                controls
                                                            />
                                                            {item.is_primary && (
                                                                <span className="absolute top-1 left-1 px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded">
                                                                    Primary
                                                                </span>
                                                            )}
                                                            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrimaryMedia(item.id)}
                                                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                                                        item.is_primary
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-white text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                    title="Set as Primary"
                                                                >
                                                                    {item.is_primary ? 'Primary' : 'Set Primary'}
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteMedia(item.id)}
                                                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Color Picker */}
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Available Colors
                                            </label>
                                            <div className="flex items-center space-x-2 flex-wrap gap-2 mb-3">
                                                {[
                                                    { name: 'Red', value: '#D0021B' },
                                                    { name: 'Orange', value: '#ff9900' },
                                                    { name: 'Blue', value: '#0000ff' },
                                                    { name: 'Purple', value: '#800080' },
                                                    { name: 'Pink', value: '#ff1493' },
                                                    { name: 'Yellow', value: '#ffff00' },
                                                    { name: 'Green', value: '#00ff00' },
                                                    { name: 'Skyblue', value: '#87CEEB' },
                                                    { name: 'Brown', value: '#8b4513' },
                                                    { name: 'Black', value: '#000000' },
                                                    { name: 'Gray', value: '#808080' },
                                                    { name: 'White', value: '#ffffff' },
                                                ].map((color) => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setMediaColor(color.value)}
                                                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                                                            mediaColor === color.value
                                                                ? 'border-blue-500 ring-2 ring-blue-300'
                                                                : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        style={{ backgroundColor: color.value }}
                                                        title={color.name}
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                                    className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                                                    title="Custom Color"
                                                >
                                                    <PlusIcon className="h-5 w-5 text-gray-400" />
                                                </button>
                                            </div>
                                            {showColorPicker && (
                                                <div className="absolute z-10 mt-2">
                                                    <div className="fixed inset-0" onClick={() => setShowColorPicker(false)}></div>
                                                    <div className="relative">
                                                        <SketchPicker
                                                            color={mediaColor || '#ffffff'}
                                                            onChange={handleColorChange}
                                                            width="220px"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-700">Selected Color:</span>
                                                {mediaColor ? (
                                                    <>
                                                        <div
                                                            className="w-5 h-5 rounded-full border border-gray-300"
                                                            style={{ backgroundColor: mediaColor }}
                                                        />
                                                        <span className="text-sm text-gray-700">
                                                            {[
                                                                { name: 'Red', value: '#D0021B' },
                                                                { name: 'Orange', value: '#ff9900' },
                                                                { name: 'Blue', value: '#0000ff' },
                                                                { name: 'Purple', value: '#800080' },
                                                                { name: 'Pink', value: '#ff1493' },
                                                                { name: 'Yellow', value: '#ffff00' },
                                                                { name: 'Green', value: '#00ff00' },
                                                                { name: 'Skyblue', value: '#87CEEB' },
                                                                { name: 'Brown', value: '#8b4513' },
                                                                { name: 'Black', value: '#000000' },
                                                                { name: 'Gray', value: '#808080' },
                                                                { name: 'White', value: '#ffffff' },
                                                            ].find(c => c.value === mediaColor)?.name || mediaColor}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setMediaColor('')}
                                                            className="text-xs text-red-600 hover:text-red-800 ml-2"
                                                        >
                                                            Clear
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-400">No color selected</span>
                                                )}
                                            </div>
                                        </div>
                                        {uploadingMedia && (
                                            <p className="text-sm text-gray-500">Uploading...</p>
                                        )}
                                    </div>

                                    {/* Media Gallery with Color Selection */}
                                    {media.length > 0 && (
                                        <div className="mt-6 border-t pt-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-4">Media Gallery</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {media.map((item: any) => (
                                                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <div className="relative group mb-2">
                                                            {item.type === 'image' ? (
                                                                <div className="relative">
                                                                    <img
                                                                        src={item.url || item.file_path}
                                                                        alt={item.file_name}
                                                                        className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                                    />
                                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-white bg-opacity-80 rounded flex items-center space-x-1">
                                                                        <PhotoIcon className="h-3 w-3 text-gray-700" />
                                                                        <span className="text-xs text-gray-700">Image</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <video
                                                                        src={item.url || item.file_path}
                                                                        className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                                        controls
                                                                    />
                                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-white bg-opacity-80 rounded flex items-center space-x-1">
                                                                        <VideoCameraIcon className="h-3 w-3 text-gray-700" />
                                                                        <span className="text-xs text-gray-700">Video</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {item.is_primary && (
                                                                <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-indigo-600 text-white rounded z-10">
                                                                    Primary
                                                                </span>
                                                            )}
                                                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrimaryMedia(item.id)}
                                                                    className={`px-2 py-1 text-xs font-medium rounded ${
                                                                        item.is_primary
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                                                                    }`}
                                                                    title="Set as Primary"
                                                                >
                                                                    {item.is_primary ? 'Primary' : 'Set Primary'}
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteMedia(item.id)}
                                                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Color
                                                            </label>
                                                            <div className="flex items-center space-x-1 flex-wrap gap-1 mb-2">
                                                                {[
                                                                    { name: 'Red', value: '#D0021B' },
                                                                    { name: 'Orange', value: '#ff9900' },
                                                                    { name: 'Blue', value: '#0000ff' },
                                                                    { name: 'Purple', value: '#800080' },
                                                                    { name: 'Pink', value: '#ff1493' },
                                                                    { name: 'Yellow', value: '#ffff00' },
                                                                    { name: 'Green', value: '#00ff00' },
                                                                    { name: 'Skyblue', value: '#87CEEB' },
                                                                    { name: 'Brown', value: '#8b4513' },
                                                                    { name: 'Black', value: '#000000' },
                                                                    { name: 'Gray', value: '#808080' },
                                                                    { name: 'White', value: '#ffffff' },
                                                                ].map((color) => (
                                                                    <button
                                                                        key={color.value}
                                                                        type="button"
                                                                        onClick={() => handleUpdateMediaColor(item.id, color.value)}
                                                                        className={`w-6 h-6 rounded-full border transition-all ${
                                                                            item.color === color.value
                                                                                ? 'border-blue-500 ring-1 ring-blue-300'
                                                                                : 'border-gray-300 hover:border-gray-400'
                                                                        }`}
                                                                        style={{ backgroundColor: color.value }}
                                                                        title={color.name}
                                                                    />
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newState = { ...mediaColorPickers };
                                                                        newState[item.id] = !newState[item.id];
                                                                        setMediaColorPickers(newState);
                                                                    }}
                                                                    className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                                                                    title="Custom Color"
                                                                >
                                                                    <PlusIcon className="h-3 w-3 text-gray-400" />
                                                                </button>
                                                            </div>
                                                            {mediaColorPickers[item.id] && (
                                                                <div className="absolute z-10 mt-1">
                                                                    <div className="fixed inset-0" onClick={() => {
                                                                        const newState = { ...mediaColorPickers };
                                                                        newState[item.id] = false;
                                                                        setMediaColorPickers(newState);
                                                                    }}></div>
                                                                    <div className="relative">
                                                                        <SketchPicker
                                                                            color={item.color || '#ffffff'}
                                                                            onChange={(color) => handleUpdateMediaColor(item.id, color.hex)}
                                                                            width="220px"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center space-x-1 text-xs">
                                                                <span className="text-gray-600">Selected:</span>
                                                                {item.color ? (
                                                                    <>
                                                                        <div
                                                                            className="w-3 h-3 rounded-full border border-gray-300"
                                                                            style={{ backgroundColor: item.color }}
                                                                        />
                                                                        <span className="text-gray-700">
                                                                            {[
                                                                                { name: 'Red', value: '#D0021B' },
                                                                                { name: 'Orange', value: '#ff9900' },
                                                                                { name: 'Blue', value: '#0000ff' },
                                                                                { name: 'Purple', value: '#800080' },
                                                                                { name: 'Pink', value: '#ff1493' },
                                                                                { name: 'Yellow', value: '#ffff00' },
                                                                                { name: 'Green', value: '#00ff00' },
                                                                                { name: 'Skyblue', value: '#87CEEB' },
                                                                                { name: 'Brown', value: '#8b4513' },
                                                                                { name: 'Black', value: '#000000' },
                                                                                { name: 'Gray', value: '#808080' },
                                                                                { name: 'White', value: '#ffffff' },
                                                                            ].find(c => c.value === item.color)?.name || item.color}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-gray-400">No color</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* Product Variations Section */}
                            <div className="border-t pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Product Variations</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddVariation}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <PlusIcon className="h-4 w-4 mr-1" />
                                        Add Variation
                                    </button>
                                </div>

                                {variations.length > 0 ? (
                                    <div className="space-y-4">
                                        {variations.map((variation: any, index: number) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Size
                                                        </label>
                                                        <select
                                                            value={variation.size || ''}
                                                            onChange={(e) => handleVariationChange(index, 'size', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        >
                                                            <option value="">Select Size</option>
                                                            <option value="XS">XS - Extra Small</option>
                                                            <option value="S">S - Small</option>
                                                            <option value="M">M - Medium</option>
                                                            <option value="L">L - Large</option>
                                                            <option value="XL">XL - Extra Large</option>
                                                            <option value="XXL">XXL - Extra Extra Large</option>
                                                            <option value="XXXL">XXXL - Extra Extra Extra Large</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Available Colors
                                                        </label>
                                                        <div className="flex items-center space-x-1 flex-wrap gap-1 mb-2">
                                                            {[
                                                                { name: 'Red', value: '#D0021B' },
                                                                { name: 'Orange', value: '#ff9900' },
                                                                { name: 'Blue', value: '#0000ff' },
                                                                { name: 'Purple', value: '#800080' },
                                                                { name: 'Pink', value: '#ff1493' },
                                                                { name: 'Yellow', value: '#ffff00' },
                                                                { name: 'Green', value: '#00ff00' },
                                                                { name: 'Skyblue', value: '#87CEEB' },
                                                                { name: 'Brown', value: '#8b4513' },
                                                                { name: 'Black', value: '#000000' },
                                                                { name: 'Gray', value: '#808080' },
                                                                { name: 'White', value: '#ffffff' },
                                                            ].map((color) => (
                                                                <button
                                                                    key={color.value}
                                                                    type="button"
                                                                    onClick={() => handleVariationChange(index, 'color', color.value)}
                                                                    className={`w-8 h-8 rounded-full border transition-all ${
                                                                        (variation.color || variationColors[index]) === color.value
                                                                            ? 'border-blue-500 ring-1 ring-blue-300'
                                                                            : 'border-gray-300 hover:border-gray-400'
                                                                    }`}
                                                                    style={{ backgroundColor: color.value }}
                                                                    title={color.name}
                                                                />
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newState = { ...variationColorPickers };
                                                                    newState[index] = !newState[index];
                                                                    setVariationColorPickers(newState);
                                                                }}
                                                                className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
                                                                title="Custom Color"
                                                            >
                                                                <PlusIcon className="h-4 w-4 text-gray-400" />
                                                            </button>
                                                        </div>
                                                        {variationColorPickers[index] && (
                                                            <div className="absolute z-10 mt-1">
                                                                <div className="fixed inset-0" onClick={() => {
                                                                    const newState = { ...variationColorPickers };
                                                                    newState[index] = false;
                                                                    setVariationColorPickers(newState);
                                                                }}></div>
                                                                <div className="relative">
                                                                    <SketchPicker
                                                                        color={variation.color || variationColors[index] || '#ffffff'}
                                                                        onChange={(color) => handleVariationColorChange(index, color)}
                                                                        width="220px"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm text-gray-700">Selected Color:</span>
                                                            {(variation.color || variationColors[index]) ? (
                                                                <>
                                                                    <div
                                                                        className="w-5 h-5 rounded-full border border-gray-300"
                                                                        style={{ backgroundColor: variation.color || variationColors[index] }}
                                                                    />
                                                                    <span className="text-sm text-gray-700">
                                                                        {[
                                                                            { name: 'Red', value: '#D0021B' },
                                                                            { name: 'Orange', value: '#ff9900' },
                                                                            { name: 'Blue', value: '#0000ff' },
                                                                            { name: 'Purple', value: '#800080' },
                                                                            { name: 'Pink', value: '#ff1493' },
                                                                            { name: 'Yellow', value: '#ffff00' },
                                                                            { name: 'Green', value: '#00ff00' },
                                                                            { name: 'Skyblue', value: '#87CEEB' },
                                                                            { name: 'Brown', value: '#8b4513' },
                                                                            { name: 'Black', value: '#000000' },
                                                                            { name: 'Gray', value: '#808080' },
                                                                            { name: 'White', value: '#ffffff' },
                                                                        ].find(c => c.value === (variation.color || variationColors[index]))?.name || (variation.color || variationColors[index])}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">No color selected</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Stock Quantity
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={variation.stock_quantity || 0}
                                                            onChange={(e) => handleVariationChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                                                            min="0"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <div className="flex items-center space-x-4 w-full">
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={variation.in_stock !== false}
                                                                    onChange={(e) => handleVariationChange(index, 'in_stock', e.target.checked)}
                                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                                />
                                                                <label className="ml-2 block text-sm text-gray-900">
                                                                    In Stock
                                                                </label>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveVariation(index)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No variations added. Click "Add Variation" to create one.</p>
                                )}
                            </div>

                            {/* Stock Quantity - After Variations */}
                            <div className="border-t pt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Stock Quantity <span className="text-red-500">*</span>
                                        {variations.length > 0 && (
                                            <span className="ml-2 text-xs text-gray-500 font-normal">(Auto-calculated from variations)</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        name="total_quantity"
                                        value={formData.total_quantity}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        disabled={variations.length > 0}
                                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.total_quantity ? 'border-red-300' : 'border-gray-300'
                                        } ${variations.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        placeholder="0"
                                    />
                                    {variations.length > 0 && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Total stock is automatically calculated from all variation stock quantities. To change it, modify individual variation stocks.
                                        </p>
                                    )}
                                    {variations.length === 0 && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter the total stock quantity for this product. If you add variations, this will be auto-calculated.
                                        </p>
                                    )}
                                    {errors.total_quantity && (
                                        <p className="mt-1 text-sm text-red-600">{errors.total_quantity}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
                            <button
                                type="button"
                                onClick={() => router.visit('/admin/products')}
                                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {isEditMode || product?.id ? 'Back to Products' : 'Cancel'}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Saving...' : isEditMode || product?.id ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}

