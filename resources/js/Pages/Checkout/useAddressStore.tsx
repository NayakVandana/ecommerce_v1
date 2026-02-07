import { api } from '@/utils/api';

export const useAddressStore = {
    list: (data?: any) => api.post('/auth/addresses', data || {}),
    store: (data: any) => api.post('/auth/addresses/store', data),
    update: (data: any) => api.post('/auth/addresses/update', data),
    delete: (data: any) => api.post('/auth/addresses/delete', data),
    setDefault: (data: any) => api.post('/auth/addresses/set-default', data),
};

