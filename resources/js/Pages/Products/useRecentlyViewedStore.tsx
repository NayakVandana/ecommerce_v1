import { api } from '@/utils/api';

export const useRecentlyViewedStore = {
    list: (data?: any) => api.post('/recently-viewed', data || {}),
    clear: (data?: any) => api.post('/recently-viewed/clear', data || {}),
    remove: (data: any) => api.post('/recently-viewed/remove', data),
};

