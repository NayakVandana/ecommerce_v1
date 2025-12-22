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

export const useAdminStore = {
    // Dashboard
    dashboard: (data?: any) => adminApi.post('/dashboard', data || {}),
    stats: (data?: any) => adminApi.post('/stats', data || {}),
    
    // Products
    products: {
        list: (data?: any) => adminApi.post('/products', data || {}),
        store: (data: any) => adminApi.post('/products/store', data),
        show: (data: any) => adminApi.post('/products/show', data),
        update: (data: any) => adminApi.post('/products/update', data),
        delete: (data: any) => adminApi.post('/products/delete', data),
        toggleStatus: (data: any) => adminApi.post('/products/toggle-status', data),
    },
    
    // Categories
    categories: {
        list: (data?: any) => adminApi.post('/categories', data || {}),
        store: (data: any) => adminApi.post('/categories/store', data),
        show: (data: any) => adminApi.post('/categories/show', data),
        update: (data: any) => adminApi.post('/categories/update', data),
        delete: (data: any) => adminApi.post('/categories/delete', data),
    },
    
    // Orders
    orders: {
        list: (data?: any) => adminApi.post('/orders', data || {}),
        show: (data: any) => adminApi.post('/orders/show', data),
        updateStatus: (data: any) => adminApi.post('/orders/update-status', data),
        cancel: (data: any) => adminApi.post('/orders/cancel', data),
    },
    
    // Users
    users: {
        list: (data?: any) => adminApi.post('/users', data || {}),
        show: (data: any) => adminApi.post('/users/show', data),
        update: (data: any) => adminApi.post('/users/update', data),
        delete: (data: any) => adminApi.post('/users/delete', data),
        toggleRole: (data: any) => adminApi.post('/users/toggle-role', data),
    },
};

