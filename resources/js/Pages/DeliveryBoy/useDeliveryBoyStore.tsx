import { api } from '@/utils/api';

export const useDeliveryBoyStore = {
    list: (data?: any) => api.post('/auth/delivery-boy/orders', data || {}),
    show: (data: any) => api.post('/auth/delivery-boy/orders/show', data),
    verifyOTP: (data: any) => api.post('/auth/delivery-boy/orders/verify-otp', data),
    getStats: (data?: any) => api.post('/auth/delivery-boy/stats', data || {}),
};

