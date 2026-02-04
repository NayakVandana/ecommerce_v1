import { api } from '@/utils/api';

export const useCheckoutStore = {
    placeOrder: (data: any) => api.post('/auth/orders/store', data),
};

