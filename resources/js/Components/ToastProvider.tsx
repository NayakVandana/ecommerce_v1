import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import ToastContainer, { Toast } from './Toast';

const ToastContext = createContext<{
    showToast: (message: string, type: any, duration: any) => string;
    success: (message: string, duration: any) => string;
    error: (message: string, duration: any) => string;
    info: (message: string, duration: any) => string;
    warning: (message: string, duration: any) => string;
} | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: any = 'info', duration: any) => {
        const id = `toast-${++toastIdCounter}`;
        const newToast: Toast = { id, message, type, duration };
        
        setToasts((prev) => [...prev, newToast]);
        
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string, duration: any) => {
        return showToast(message, 'success', duration);
    }, [showToast]);

    const error = useCallback((message: string, duration: any) => {
        return showToast(message, 'error', duration);
    }, [showToast]);

    const info = useCallback((message: string, duration: any) => {
        return showToast(message, 'info', duration);
    }, [showToast]);

    const warning = useCallback((message: string, duration: any) => {
        return showToast(message, 'warning', duration);
    }, [showToast]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        showToast,
        success,
        error,
        info,
        warning,
    }), [showToast, success, error, info, warning]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    
    if (context === undefined) {
        throw new Error(
            'useToast must be used within a ToastProvider. ' +
            'Make sure your component is wrapped by AdminLayout which provides the ToastProvider.'
        );
    }
    
    return context;
}

