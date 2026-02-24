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

export const useCustomerStore = {
    list: (data?: any) => adminApi.post('/customers', data || {}),
    store: (data: any) => adminApi.post('/customers/store', data),
    show: (data: any) => adminApi.post('/customers/show', data),
    update: (data: any) => adminApi.post('/customers/update', data),
    delete: (data: any) => adminApi.post('/customers/delete', data),
    toggleStatus: (data: any) => adminApi.post('/customers/toggle-status', data),
};

