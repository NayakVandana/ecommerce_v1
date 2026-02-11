import { api } from '@/utils/api';

export const useWishlistStore = {
    list: (data?: any) => api.post('/wishlist', data || {}),
    add: (data: any) => api.post('/wishlist/add', data),
    remove: (data: any) => api.post('/wishlist/remove', data),
    clear: (data?: any) => api.post('/wishlist/clear', data || {}),
    check: (data: any) => api.post('/wishlist/check', data),
};

