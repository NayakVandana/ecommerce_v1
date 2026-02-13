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

export const useOrderStore = {
    list: (data?: any) => adminApi.post('/orders', data || {}),
    show: (data: any) => adminApi.post('/orders/show', data),
    updateStatus: (data: any) => adminApi.post('/orders/update-status', data),
    cancel: (data: any) => adminApi.post('/orders/cancel', data),
    getCounts: (data?: any) => adminApi.post('/orders/counts', data || {}),
    approveReturn: (data: any) => adminApi.post('/orders/approve-return', data),
    rejectReturn: (data: any) => adminApi.post('/orders/reject-return', data),
    processRefund: (data: any) => adminApi.post('/orders/process-refund', data),
    approveReplacement: (data: any) => adminApi.post('/orders/approve-replacement', data),
    rejectReplacement: (data: any) => adminApi.post('/orders/reject-replacement', data),
    processReplacement: (data: any) => adminApi.post('/orders/process-replacement', data),
    updateDeliveryDate: (data: any) => adminApi.post('/orders/update-delivery-date', data),
};

