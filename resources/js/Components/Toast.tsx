import { useEffect, useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: any;
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onClose(toast.id), 300);
        }, toast.duration || 3000);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const typeConfig = {
        success: {
            icon: CheckCircleIcon,
            iconColor: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-400',
            textColor: 'text-green-800',
        },
        error: {
            icon: XCircleIcon,
            iconColor: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-400',
            textColor: 'text-red-800',
        },
        warning: {
            icon: ExclamationTriangleIcon,
            iconColor: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-400',
            textColor: 'text-yellow-800',
        },
        info: {
            icon: InformationCircleIcon,
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-400',
            textColor: 'text-blue-800',
        },
    };

    const config = typeConfig[toast.type];
    const Icon = config.icon;

    return (
        <div
            className={`transform transition-all duration-300 ease-in-out ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div className={`rounded-lg border ${config.bgColor} ${config.borderColor} p-4 shadow-lg min-w-[300px] max-w-md`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${config.iconColor}`} />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className={`text-sm font-medium ${config.textColor}`}>
                            {toast.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(() => onClose(toast.id), 300);
                            }}
                            className={`inline-flex rounded-md ${config.textColor} hover:opacity-75 focus:outline-none`}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[10000] space-y-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
}

