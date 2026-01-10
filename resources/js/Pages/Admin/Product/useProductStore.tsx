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

export const useProductStore = {
    list: (data?: any) => adminApi.post('/products', data || {}),
    store: (data: any) => adminApi.post('/products/store', data),
    show: (data: any) => adminApi.post('/products/show', data),
    update: (data: any) => adminApi.post('/products/update', data),
    delete: (data: any) => adminApi.post('/products/delete', data),
    toggleStatus: (data: any) => adminApi.post('/products/toggle-status', data),
    uploadMedia: (formData: FormData) => {
        const token = localStorage.getItem('auth_token');
        return axios.post('/api/admin/products/upload-media', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    deleteMedia: (data: any) => adminApi.post('/products/delete-media', data),
    updateMedia: (data: any) => adminApi.post('/products/update-media', data),
    updateMediaOrder: (data: any) => adminApi.post('/products/update-media-order', data),
};

