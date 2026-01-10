import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    buttonText = 'OK',
}: any) {
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

    if (!isOpen) return null;

    const typeConfig = {
        success: {
            icon: CheckCircleIcon,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-100',
            titleColor: 'text-green-900',
        },
        error: {
            icon: XCircleIcon,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            titleColor: 'text-red-900',
        },
        warning: {
            icon: ExclamationTriangleIcon,
            iconColor: 'text-yellow-600',
            iconBg: 'bg-yellow-100',
            titleColor: 'text-yellow-900',
        },
        info: {
            icon: InformationCircleIcon,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
            titleColor: 'text-blue-900',
        },
    };

    const config = typeConfig[type];
    const Icon = config.icon;
    const defaultTitle = title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information');

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="alert-modal-title" role="dialog" aria-modal="true">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${config.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                                <Icon className={`h-6 w-6 ${config.iconColor}`} aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className={`text-lg font-medium leading-6 ${config.titleColor}`} id="alert-modal-title">
                                    {defaultTitle}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

