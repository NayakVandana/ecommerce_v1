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

export const useContactStore = {
    list: (data?: any) => adminApi.post('/contacts', data || {}),
    show: (data: any) => adminApi.post('/contacts/show', data),
    markAsRead: (data: any) => adminApi.post('/contacts/mark-read', data),
    markAsUnread: (data: any) => adminApi.post('/contacts/mark-unread', data),
    delete: (data: any) => adminApi.post('/contacts/delete', data),
    getCounts: () => adminApi.post('/contacts/counts', {}),
};

