import { api } from '@/utils/api';

export const useOrderStore = {
    list: (data?: any) => api.post('/orders', data || {}),
    store: (data: any) => api.post('/orders/store', data),
    show: (data: any) => api.post('/orders/show', data),
    cancel: (data: any) => api.post('/orders/cancel', data),
};

