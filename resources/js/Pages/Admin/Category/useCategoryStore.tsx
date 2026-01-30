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

export const useCategoryStore = {
    list: (data?: any) => adminApi.post('/categories', data || {}),
    store: (data: any) => adminApi.post('/categories/store', data),
    show: (data: any) => adminApi.post('/categories/show', data),
    update: (data: any) => adminApi.post('/categories/update', data),
    delete: (data: any) => adminApi.post('/categories/delete', data),
    getSubcategories: (data: any) => adminApi.post('/categories/subcategories', data),
};

