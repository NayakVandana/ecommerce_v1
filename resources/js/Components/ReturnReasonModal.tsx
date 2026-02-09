import { useEffect, useState } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ReturnReasonModal({
    isOpen,
    onClose,
    onConfirm,
    loading = false,
}: any) {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [customReason, setCustomReason] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            // Reset form when modal closes
            setSelectedReason('');
            setCustomReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const returnReasons = [
        { value: 'defective_item', label: 'Defective Item' },
        { value: 'wrong_item', label: 'Wrong Item Received' },
        { value: 'not_as_described', label: 'Not as Described' },
        { value: 'changed_mind', label: 'Changed My Mind' },
        { value: 'damaged_during_delivery', label: 'Damaged During Delivery' },
        { value: 'other', label: 'Other' },
    ];

    const handleConfirm = () => {
        if (!selectedReason) {
            return;
        }

        if (selectedReason === 'other' && !customReason.trim()) {
            return;
        }

        onConfirm({
            return_reason: selectedReason,
            return_notes: selectedReason === 'other' ? customReason.trim() : null,
        });
    };

    const canConfirm = selectedReason && (selectedReason !== 'other' || customReason.trim());

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                                <ArrowPathIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                    Request Return/Refund
                                </h3>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 mb-4">
                                        Please select a reason for return/refund:
                                    </p>
                                    
                                    <div className="space-y-2">
                                        {returnReasons.map((reason) => (
                                            <label
                                                key={reason.value}
                                                className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name="return_reason"
                                                    value={reason.value}
                                                    checked={selectedReason === reason.value}
                                                    onChange={(e) => setSelectedReason(e.target.value)}
                                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                                                />
                                                <span className="ml-3 text-sm text-gray-700">{reason.label}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {selectedReason === 'other' && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Please specify the reason:
                                            </label>
                                            <textarea
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                placeholder="Enter return reason..."
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                                                maxLength={500}
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                {customReason.length}/500 characters
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!canConfirm || loading}
                            className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Return Request'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

