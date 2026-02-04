import axios from 'axios';

const adminApi = axios.create({
    baseURL: '/api/admin',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add token to admin requests
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const useCouponStore = {
    list: (data?: any) => adminApi.post('/coupons', data || {}),
    store: (data: any) => adminApi.post('/coupons/store', data),
    show: (data: any) => adminApi.post('/coupons/show', data),
    update: (data: any) => adminApi.post('/coupons/update', data),
    delete: (data: any) => adminApi.post('/coupons/delete', data),
    toggleStatus: (data: any) => adminApi.post('/coupons/toggle-status', data),
    getUsages: (data: any) => adminApi.post('/coupons/usages', data),
    getAllUsages: (data?: any) => adminApi.post('/coupons/all-usages', data || {}),
};

