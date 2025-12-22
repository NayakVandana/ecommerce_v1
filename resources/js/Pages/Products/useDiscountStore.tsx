import { api } from '@/utils/api';

export const useDiscountStore = {
    list: (data?: any) => api.post('/discounts', data || {}),
    validate: (data: any) => api.post('/discounts/validate', data),
};

