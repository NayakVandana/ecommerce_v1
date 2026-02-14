import { XMarkIcon } from '@heroicons/react/24/outline';

export default function RecentlyViewedDetailsModal({
    isOpen,
    onClose,
    selectedItem,
    loadingDetails
}: any) {
    if (!isOpen || !selectedItem) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Recently Viewed Product Details</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Product Information */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Product Information</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-start space-x-4">
                                            {selectedItem.product?.media?.[0] && (
                                                <img
                                                    src={selectedItem.product.media[0].url || selectedItem.product.media[0].file_path}
                                                    alt={selectedItem.product.product_name}
                                                    className="h-24 w-24 object-cover rounded-md"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h5 className="text-lg font-semibold text-gray-900">
                                                    {selectedItem.product?.product_name || 'N/A'}
                                                </h5>
                                                {selectedItem.product?.categoryRelation && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Category: {selectedItem.product.categoryRelation.name}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Price: ₹{parseFloat(selectedItem.product?.final_price || selectedItem.product?.price || '0').toFixed(2)}
                                                </p>
                                                {selectedItem.product?.description && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {selectedItem.product.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Information */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Information</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        {selectedItem.user ? (
                                            <div>
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-medium">Name:</span> {selectedItem.user.name}
                                                </p>
                                                <p className="text-sm text-gray-900 mt-2">
                                                    <span className="font-medium">Email:</span> {selectedItem.user.email}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    <span className="font-medium">Type:</span> Authenticated User
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-medium">Type:</span> Guest User
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    <span className="font-medium">Session ID:</span> {selectedItem.session_id}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* View Information */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-3">View Information</h4>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-medium">Viewed At:</span> {selectedItem.viewed_at ? new Date(selectedItem.viewed_at).toLocaleString() : 'N/A'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            <span className="font-medium">Record ID:</span> {selectedItem.id}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            <span className="font-medium">Created:</span> {selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

