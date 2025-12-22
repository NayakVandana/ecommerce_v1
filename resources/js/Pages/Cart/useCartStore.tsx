import { api } from '@/utils/api';

export const useCartStore = {
    list: (data?: any) => api.post('/cart', data || {}),
    add: (data: any) => api.post('/cart/add', data),
    update: (data: any) => api.post('/cart/update', data),
    remove: (data: any) => api.post('/cart/remove', data),
    clear: (data?: any) => api.post('/cart/clear', data || {}),
};

