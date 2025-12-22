import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function FlashMessage() {
    const { flash }: any = usePage().props;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (flash?.message || flash?.success || flash?.error) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    if (!visible || (!flash?.message && !flash?.success && !flash?.error)) {
        return null;
    }

    const message = flash.success || flash.error || flash.message;
    const type = flash.success ? 'success' : flash.error ? 'error' : 'info';

    const styles = {
        success: 'bg-green-50 border-green-400 text-green-800',
        error: 'bg-red-50 border-red-400 text-red-800',
        info: 'bg-blue-50 border-blue-400 text-blue-800',
    };

    const icons = {
        success: CheckCircleIcon,
        error: ExclamationCircleIcon,
        info: InformationCircleIcon,
    };

    const Icon = icons[type];

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full">
            <div className={`rounded-lg border p-4 shadow-lg ${styles[type]}`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={() => setVisible(false)}
                            className={`inline-flex rounded-md ${styles[type]} hover:opacity-75 focus:outline-none`}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

