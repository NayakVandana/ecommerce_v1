import { api } from '@/utils/api';

export const useProductStore = {
    list: (data: any) => api.post('/products', data),
    show: (data: any) => api.post('/products/show', data),
    search: (data: any) => api.post('/products/search', data),
    searchSuggestions: (data: any) => api.post('/products/search-suggestions', data),
};

