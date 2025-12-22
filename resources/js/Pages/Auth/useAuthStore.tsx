import { api } from '@/utils/api';

export const useAuthStore = {
    register: (data: any) => api.post('/register', data),
    login: (data: any) => api.post('/login', data),
    logout: (data?: any) => api.post('/logout', data || {}),
    getUser: (data?: any) => api.post('/user', data || {}),
    updateProfile: (data: any) => api.post('/user/update', data),
};

