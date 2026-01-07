import { api } from '@/utils/api';
import { isAuthenticated } from '@/utils/sessionStorage';

// Helper function to get the correct API path based on authentication status
const getCartPath = (path: string): string => {
    return isAuthenticated() ? `/auth/cart${path}` : `/cart${path}`;
};

export const useCartStore = {
    list: (data?: any) => api.post(getCartPath(''), data || {}),
    add: (data: any) => api.post(getCartPath('/add'), data),
    update: (data: any) => api.post(getCartPath('/update'), data),
    remove: (data: any) => api.post(getCartPath('/remove'), data),
    clear: (data?: any) => api.post(getCartPath('/clear'), data || {}),
};

