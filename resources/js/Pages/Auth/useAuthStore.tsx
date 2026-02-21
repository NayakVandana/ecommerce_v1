import { api } from '@/utils/api';

export const useAuthStore = {
    register: (data: any) => api.post('/register', data),
    login: (data: any) => api.post('/login', data),
    logout: (data?: any) => api.post('/auth/logout', data || {}),
    getUser: (data?: any) => api.post('/auth/user', data || {}),
    updateProfile: (data: any) => api.post('/auth/user/update', data),
    forgotPassword: (data: any) => api.post('/forgot-password', data),
    resendOtp: (data: any) => api.post('/resend-otp', data),
    verifyOtp: (data: any) => api.post('/verify-otp', data),
    resetPassword: (data: any) => api.post('/reset-password', data),
};

