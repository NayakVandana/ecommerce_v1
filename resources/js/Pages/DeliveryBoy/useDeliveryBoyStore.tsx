import { api } from '@/utils/api';

export const useDeliveryBoyStore = {
    list: (data?: any) => api.post('/auth/delivery-boy/orders', data || {}),
    show: (data: any) => api.post('/auth/delivery-boy/orders/show', data),
    generateOTP: (data: any) => api.post('/auth/delivery-boy/orders/generate-otp', data),
    verifyOTP: (data: any) => api.post('/auth/delivery-boy/orders/verify-otp', data),
    uploadOpenBoxMedia: (data: FormData) => api.post('/auth/delivery-boy/orders/upload-open-box-media', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    getOpenBoxMedia: (data: any) => api.post('/auth/delivery-boy/orders/get-open-box-media', data),
    deleteOpenBoxMedia: (data: any) => api.post('/auth/delivery-boy/orders/delete-open-box-media', data),
    getStats: (data?: any) => api.post('/auth/delivery-boy/stats', data || {}),
};

