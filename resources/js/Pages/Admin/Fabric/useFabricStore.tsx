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
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export const useFabricStore = {
    list: (data?: any) => adminApi.post('/fabrics/list', data || {}),
    index: (data?: any) => adminApi.post('/fabrics', data || {}),
    store: (data: any) => adminApi.post('/fabrics/store', data),
    show: (data: any) => adminApi.post('/fabrics/show', data),
    update: (data: any) => adminApi.post('/fabrics/update', data),
    delete: (data: any) => adminApi.post('/fabrics/delete', data),
    toggleStatus: (data: any) => adminApi.post('/fabrics/toggle-status', data),
};

