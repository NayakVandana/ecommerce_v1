import { api } from '@/utils/api';

export const useOrderStore = {
    list: (data?: any) => api.post('/auth/orders', data || {}),
    store: (data: any) => api.post('/auth/orders/store', data),
    show: (data: any) => api.post('/auth/orders/show', data),
    cancel: (data: any) => api.post('/auth/orders/cancel', data),
    requestReturn: (data: any) => api.post('/auth/orders/request-return', data),
};

