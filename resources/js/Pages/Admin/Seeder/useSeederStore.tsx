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

export const useSeederStore = {
    list: (data?: any) => adminApi.post('/seeders', data || {}),
    run: (data: any) => adminApi.post('/seeders/run', data),
    runAll: (data?: any) => adminApi.post('/seeders/run-all', data || {}),
    refresh: (data: any) => adminApi.post('/seeders/refresh', data),
};

