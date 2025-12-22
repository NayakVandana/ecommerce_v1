import { api } from '@/utils/api';

export const useCouponStore = {
    validate: (data: any) => api.post('/coupons/validate', data),
    apply: (data: any) => api.post('/coupons/apply', data),
};

