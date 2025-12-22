import { api } from '@/utils/api';

export const useCategoryStore = {
    list: (data?: any) => api.post('/categories', data || {}),
    show: (data: any) => api.post('/categories/show', data),
};

