import { useEffect, useState } from 'react';
import { useDeliveryBoyStore } from './useDeliveryBoyStore';
import AppLayout from '../Layouts/AppLayout';
import AlertModal from '../../Components/AlertModal';
import { TruckIcon, CheckCircleIcon, ClockIcon, PhotoIcon, VideoCameraIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CubeIcon, CameraIcon, FolderOpenIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function DeliveryBoyIndex() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [otpCodes, setOtpCodes] = useState<{[key: number]: string}>({});
    const [verifyingOTP, setVerifyingOTP] = useState<number | null>(null);
    const [generatingOTP, setGeneratingOTP] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
    const [mediaViewerIndex, setMediaViewerIndex] = useState<{orderId: number, itemIndex: number, mediaIndex: number} | null>(null);
    const [openBoxOrders, setOpenBoxOrders] = useState<Set<number>>(new Set());
    const [uploadingMedia, setUploadingMedia] = useState<{orderId: number, itemId?: number} | null>(null);
    const [verificationMedia, setVerificationMedia] = useState<{[key: number]: any[]}>({});

    useEffect(() => {
        loadOrders();
        loadStats();
    }, []);

    useEffect(() => {
        // Load verification media for all orders
        orders.forEach(order => {
            if (order.id && !verificationMedia[order.id]) {
                loadVerificationMedia(order.id);
            }
        });
    }, [orders]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await useDeliveryBoyStore.list({ status: 'out_for_delivery' });
            if (response.data?.status) {
                setOrders(response.data.data?.data || response.data.data || []);
            }
        } catch (error: any) {
            console.error('Error loading orders:', error);
            if (error.response?.status === 403) {
                setAlertMessage('You do not have permission to access this page');
                setAlertType('error');
                setShowAlert(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await useDeliveryBoyStore.getStats();
            if (response.data?.status) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleVerifyOTP = async (orderId: number) => {
        const otpCode = otpCodes[orderId] || '';
        if (!otpCode || otpCode.length !== 6) {
            setAlertMessage('Please enter a valid 6-digit OTP');
            setAlertType('warning');
            setShowAlert(true);
            return;
        }

        try {
            setVerifyingOTP(orderId);
            const response = await useDeliveryBoyStore.verifyOTP({
                id: orderId,
                otp: otpCode,
            });

            if (response.data?.status) {
                // Optimistically remove the order from the list
                setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
                
                // Clear OTP for this order
                setOtpCodes(prev => {
                    const newCodes = { ...prev };
                    delete newCodes[orderId];
                    return newCodes;
                });
                
                setAlertMessage('OTP verified successfully! Order marked as delivered.');
                setAlertType('success');
                setShowAlert(true);
                
                // Reload orders and stats
                await loadOrders();
                await loadStats();
            } else {
                setAlertMessage(response.data?.message || 'Invalid OTP code');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to verify OTP');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setVerifyingOTP(null);
        }
    };

    const handleOtpChange = (orderId: number, value: string) => {
        setOtpCodes(prev => ({
            ...prev,
            [orderId]: value.replace(/\D/g, '')
        }));
    };

    const handleGenerateOTP = async (orderId: number) => {
        try {
            setGeneratingOTP(orderId);
            const response = await useDeliveryBoyStore.generateOTP({
                id: orderId,
            });

            if (response.data?.status) {
                setAlertMessage('OTP generated successfully!');
                setAlertType('success');
                setShowAlert(true);
                
                // Reload orders to get the updated OTP
                await loadOrders();
            } else {
                setAlertMessage(response.data?.message || 'Failed to generate OTP');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error generating OTP:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to generate OTP');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setGeneratingOTP(null);
        }
    };

    const toggleOrderExpansion = (orderId: number) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const openMediaViewer = (orderId: number, itemIndex: number, mediaIndex: number = 0) => {
        setMediaViewerIndex({ orderId, itemIndex, mediaIndex });
    };

    const closeMediaViewer = () => {
        setMediaViewerIndex(null);
    };

    const navigateMedia = (direction: 'prev' | 'next') => {
        if (!mediaViewerIndex) return;
        
        const order = orders.find(o => o.id === mediaViewerIndex.orderId);
        if (!order || !order.items) return;
        
        const item = order.items[mediaViewerIndex.itemIndex];
        if (!item || !item.product || !item.product.media) return;
        
        const media = item.product.media;
        let newIndex = mediaViewerIndex.mediaIndex;
        
        if (direction === 'next') {
            newIndex = (newIndex + 1) % media.length;
        } else {
            newIndex = (newIndex - 1 + media.length) % media.length;
        }
        
        setMediaViewerIndex({ ...mediaViewerIndex, mediaIndex: newIndex });
    };

    const getProductMedia = (item: any) => {
        if (!item.product || !item.product.media || item.product.media.length === 0) {
            return [];
        }
        
        // Sort media by is_primary first, then by sort_order
        return [...item.product.media].sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    };

    const getPrimaryImage = (item: any) => {
        const media = getProductMedia(item);
        const primaryImage = media.find((m: any) => m.is_primary && m.type === 'image') || media.find((m: any) => m.type === 'image');
        if (primaryImage) {
            return primaryImage.url || (primaryImage.file_path ? `/storage/${primaryImage.file_path}` : '/placeholder-image.png');
        }
        return '/placeholder-image.png';
    };

    const loadVerificationMedia = async (orderId: number) => {
        try {
            const response = await useDeliveryBoyStore.getOpenBoxMedia({ order_id: orderId });
            if (response.data?.status) {
                setVerificationMedia(prev => ({
                    ...prev,
                    [orderId]: response.data.data || []
                }));
            }
        } catch (error) {
            console.error('Error loading verification media:', error);
        }
    };

    const handleOpenBoxToggle = (orderId: number) => {
        setOpenBoxOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
                // Load verification media when opening
                if (!verificationMedia[orderId]) {
                    loadVerificationMedia(orderId);
                }
            }
            return newSet;
        });
    };

    const handleFileUpload = async (orderId: number, files: FileList | null, itemId?: number) => {
        if (!files || files.length === 0) return;

        try {
            setUploadingMedia({ orderId, itemId });
            const formData = new FormData();
            formData.append('order_id', orderId.toString());
            if (itemId) {
                formData.append('order_item_id', itemId.toString());
            }
            Array.from(files).forEach(file => {
                formData.append('files[]', file);
            });

            const response = await useDeliveryBoyStore.uploadOpenBoxMedia(formData);
            if (response.data?.status) {
                setAlertMessage('Media uploaded successfully!');
                setAlertType('success');
                setShowAlert(true);
                await loadVerificationMedia(orderId);
                await loadOrders();
            } else {
                setAlertMessage(response.data?.message || 'Failed to upload media');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error uploading media:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to upload media');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setUploadingMedia(null);
        }
    };

    const handleDeleteVerificationMedia = async (mediaId: number, orderId: number) => {
        if (!confirm('Are you sure you want to delete this media?')) return;

        try {
            const response = await useDeliveryBoyStore.deleteOpenBoxMedia({ id: mediaId });
            if (response.data?.status) {
                setAlertMessage('Media deleted successfully');
                setAlertType('success');
                setShowAlert(true);
                await loadVerificationMedia(orderId);
            } else {
                setAlertMessage(response.data?.message || 'Failed to delete media');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error deleting media:', error);
            setAlertMessage(error.response?.data?.message || 'Failed to delete media');
            setAlertType('error');
            setShowAlert(true);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading orders...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage your assigned orders and complete deliveries</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <TruckIcon className="h-8 w-8 text-indigo-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_orders || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <ClockIcon className="h-8 w-8 text-yellow-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Pending Delivery</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending_delivery || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Delivered</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.delivered || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm text-gray-500">Today's Deliveries</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.today_deliveries || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Assigned Orders</h2>
                    </div>

                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders assigned</h3>
                            <p className="mt-1 text-sm text-gray-500">You don't have any orders assigned for delivery yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {orders
                                .filter((order: any) => 
                                    order.status === 'out_for_delivery' && 
                                    !order.otp_verified &&
                                    order.delivery_boy_id // Only show orders assigned to this delivery boy
                                )
                                .map((order: any) => (
                                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Order #{order.order_number || order.id}
                                                </h3>
                                                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    Out for Delivery
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                                                    <p className="text-sm font-medium text-gray-900">{order.name}</p>
                                                    <p className="text-sm text-gray-600">{order.phone}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                                                    <p className="text-sm text-gray-900">{order.address}</p>
                                                    <p className="text-sm text-gray-600">{order.district ? `${order.district}, ` : ''}{order.city}, {order.postal_code}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <p className="text-xs text-gray-500 mb-1">Order Total</p>
                                                <p className="text-lg font-bold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</p>
                                            </div>

                                            {/* Order Items Section */}
                                            {order.items && order.items.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={() => toggleOrderExpansion(order.id)}
                                                            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            <CubeIcon className="h-4 w-4" />
                                                            <span>View Products ({order.items.length})</span>
                                                            <span className={`transform transition-transform ${expandedOrders.has(order.id) ? 'rotate-180' : ''}`}>
                                                                ▼
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenBoxToggle(order.id)}
                                                            className="flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
                                                        >
                                                            <FolderOpenIcon className="h-4 w-4" />
                                                            <span>Open Box Verification</span>
                                                            <span className={`transform transition-transform ${openBoxOrders.has(order.id) ? 'rotate-180' : ''}`}>
                                                                ▼
                                                            </span>
                                                        </button>
                                                    </div>
                                                    
                                                    {expandedOrders.has(order.id) && (
                                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {order.items.map((item: any, itemIndex: number) => {
                                                                const media = getProductMedia(item);
                                                                const primaryImage = getPrimaryImage(item);
                                                                const hasMedia = media.length > 0;
                                                                
                                                                return (
                                                                    <div key={item.id || itemIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                                        <div className="flex gap-3">
                                                                            <div className="relative flex-shrink-0">
                                                                                <img
                                                                                    src={primaryImage}
                                                                                    alt={item.product_name || 'Product'}
                                                                                    className="w-20 h-20 object-cover rounded-md border border-gray-300"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                                                    }}
                                                                                />
                                                                                {hasMedia && (
                                                                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                                                                        {media.filter((m: any) => m.type === 'image').length > 0 && (
                                                                                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                                                                <PhotoIcon className="h-3 w-3" />
                                                                                                {media.filter((m: any) => m.type === 'image').length}
                                                                                            </span>
                                                                                        )}
                                                                                        {media.filter((m: any) => m.type === 'video').length > 0 && (
                                                                                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                                                                <VideoCameraIcon className="h-3 w-3" />
                                                                                                {media.filter((m: any) => m.type === 'video').length}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                                                    {item.product_name || 'Product'}
                                                                                </h4>
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    Qty: {item.quantity} × ₹{Number(item.price || 0).toFixed(2)}
                                                                                </p>
                                                                                {(item.size || item.color) && (
                                                                                    <p className="text-xs text-gray-500">
                                                                                        {item.size && `Size: ${item.size}`}
                                                                                        {item.size && item.color && ' • '}
                                                                                        {item.color && `Color: ${item.color}`}
                                                                                    </p>
                                                                                )}
                                                                                {hasMedia && (
                                                                                    <button
                                                                                        onClick={() => openMediaViewer(order.id, itemIndex, 0)}
                                                                                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                                                    >
                                                                                        View Images & Videos
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Open Box Verification Section */}
                                                    {openBoxOrders.has(order.id) && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                                                    <FolderOpenIcon className="h-5 w-5" />
                                                                    Open Box Verification
                                                                </h4>
                                                                <p className="text-xs text-green-700 mb-4">
                                                                    Capture photos or videos of the opened box to verify the contents match the order.
                                                                </p>
                                                                
                                                                {/* Upload Button */}
                                                                <div className="mb-4">
                                                                    <label className="cursor-pointer">
                                                                        <input
                                                                            type="file"
                                                                            multiple
                                                                            accept="image/*,video/*"
                                                                            className="hidden"
                                                                            onChange={(e) => handleFileUpload(order.id, e.target.files)}
                                                                            disabled={uploadingMedia?.orderId === order.id}
                                                                        />
                                                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                                                                            <CameraIcon className="h-4 w-4" />
                                                                            {uploadingMedia?.orderId === order.id ? 'Uploading...' : 'Upload Photos/Videos'}
                                                                        </div>
                                                                    </label>
                                                                </div>

                                                                {/* Verification Media Display */}
                                                                {verificationMedia[order.id] && verificationMedia[order.id].length > 0 && (
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                                        {verificationMedia[order.id].map((media: any) => (
                                                                            <div key={media.id} className="relative group">
                                                                                {media.type === 'video' ? (
                                                                                    <video
                                                                                        src={media.url || (media.file_path ? `/storage/${media.file_path}` : '')}
                                                                                        className="w-full h-32 object-cover rounded-md border border-gray-300"
                                                                                        controls
                                                                                    />
                                                                                ) : (
                                                                                    <img
                                                                                        src={media.url || (media.file_path ? `/storage/${media.file_path}` : '/placeholder-image.png')}
                                                                                        alt="Verification"
                                                                                        className="w-full h-32 object-cover rounded-md border border-gray-300"
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                                <button
                                                                                    onClick={() => handleDeleteVerificationMedia(media.id, order.id)}
                                                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                    title="Delete"
                                                                                >
                                                                                    <TrashIcon className="h-4 w-4" />
                                                                                </button>
                                                                                {media.type === 'video' && (
                                                                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                                        <VideoCameraIcon className="h-3 w-3" />
                                                                                        Video
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Per-Item Upload (Optional) */}
                                                                {expandedOrders.has(order.id) && (
                                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                                        <p className="text-xs font-medium text-gray-700 mb-2">Upload verification for specific items:</p>
                                                                        <div className="space-y-2">
                                                                            {order.items.map((item: any, itemIndex: number) => (
                                                                                <div key={item.id || itemIndex} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                                                                    <span className="text-xs text-gray-700 truncate flex-1">{item.product_name}</span>
                                                                                    <label className="cursor-pointer ml-2">
                                                                                        <input
                                                                                            type="file"
                                                                                            multiple
                                                                                            accept="image/*,video/*"
                                                                                            className="hidden"
                                                                                            onChange={(e) => handleFileUpload(order.id, e.target.files, item.id)}
                                                                                            disabled={uploadingMedia?.orderId === order.id && uploadingMedia?.itemId === item.id}
                                                                                        />
                                                                                        <span className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1">
                                                                                            {uploadingMedia?.orderId === order.id && uploadingMedia?.itemId === item.id ? 'Uploading...' : 'Upload'}
                                                                                        </span>
                                                                                    </label>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="ml-6">
                                            {order.otp_code && !order.otp_verified ? (
                                                <div className="w-80 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                                                    <p className="text-sm font-semibold text-gray-900 mb-3">Enter OTP to Complete Delivery</p>
                                                    <p className="text-xs text-gray-600 mb-3">Ask the customer for the 6-digit OTP code to verify delivery</p>
                                                    <div className="space-y-3">
                                                        <input
                                                            type="text"
                                                            maxLength={6}
                                                            value={otpCodes[order.id] || ''}
                                                            onChange={(e) => handleOtpChange(order.id, e.target.value)}
                                                            placeholder="Enter 6-digit OTP"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerifyOTP(order.id)}
                                                            disabled={(otpCodes[order.id] || '').length !== 6 || verifyingOTP === order.id}
                                                            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {verifyingOTP === order.id ? 'Verifying...' : 'Verify OTP & Complete Delivery'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : order.otp_verified ? (
                                                <div className="w-80 bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                                                    <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                                    <p className="text-sm font-semibold text-green-900">Order Delivered</p>
                                                    {order.delivered_at && (
                                                        <p className="text-xs text-green-700 mt-1">
                                                            Delivered on {new Date(order.delivered_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-80 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                                                    <ClockIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                                    <p className="text-sm font-semibold text-yellow-900 mb-2">OTP Not Generated</p>
                                                    <p className="text-xs text-yellow-700 mb-3">Click the button below to generate OTP for this order</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleGenerateOTP(order.id)}
                                                        disabled={generatingOTP === order.id}
                                                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {generatingOTP === order.id ? 'Generating...' : 'Generate OTP'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                message={alertMessage}
                type={alertType}
            />

            {/* Media Viewer Modal */}
            {mediaViewerIndex && (() => {
                const order = orders.find(o => o.id === mediaViewerIndex.orderId);
                if (!order || !order.items) return null;
                
                const item = order.items[mediaViewerIndex.itemIndex];
                if (!item || !item.product) return null;
                
                const media = getProductMedia(item);
                if (media.length === 0) return null;
                
                const currentMedia = media[mediaViewerIndex.mediaIndex];
                const mediaUrl = currentMedia.url || (currentMedia.file_path ? `/storage/${currentMedia.file_path}` : '');
                const isVideo = currentMedia.type === 'video';
                
                return (
                    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeMediaViewer}>
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" />
                            
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {item.product_name || 'Product'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {mediaViewerIndex.mediaIndex + 1} of {media.length}
                                            </p>
                                        </div>
                                        <button
                                            onClick={closeMediaViewer}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                    
                                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                                        {isVideo ? (
                                            <video
                                                src={mediaUrl}
                                                controls
                                                autoPlay
                                                className="w-full h-full object-contain"
                                                style={{ maxHeight: '600px' }}
                                            />
                                        ) : (
                                            <img
                                                src={mediaUrl || '/placeholder-image.png'}
                                                alt={item.product_name || 'Product'}
                                                className="w-full h-full object-contain"
                                                style={{ maxHeight: '600px' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                }}
                                            />
                                        )}
                                        
                                        {media.length > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateMedia('prev');
                                                    }}
                                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
                                                >
                                                    <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateMedia('next');
                                                    }}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg"
                                                >
                                                    <ChevronRightIcon className="h-6 w-6 text-gray-700" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Media Thumbnails */}
                                    {media.length > 1 && (
                                        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                            {media.map((m: any, idx: number) => {
                                                const thumbUrl = m.type === 'video' 
                                                    ? getPrimaryImage(item)
                                                    : (m.url || (m.file_path ? `/storage/${m.file_path}` : '/placeholder-image.png'));
                                                
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMediaViewerIndex({ ...mediaViewerIndex, mediaIndex: idx });
                                                        }}
                                                        className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                                                            idx === mediaViewerIndex.mediaIndex 
                                                                ? 'border-indigo-600' 
                                                                : 'border-gray-300'
                                                        }`}
                                                    >
                                                        {m.type === 'video' ? (
                                                            <div className="relative w-full h-full bg-gray-200 flex items-center justify-center">
                                                                <img
                                                                    src={thumbUrl}
                                                                    alt="Video thumbnail"
                                                                    className="w-full h-full object-cover opacity-50"
                                                                />
                                                                <VideoCameraIcon className="absolute h-6 w-6 text-gray-700" />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={thumbUrl}
                                                                alt={`Media ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                                }}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AppLayout>
    );
}

