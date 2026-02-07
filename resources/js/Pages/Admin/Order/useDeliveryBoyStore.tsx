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

export const useDeliveryBoyStore = {
    getDeliveryBoys: (data?: any) => adminApi.post('/orders/delivery-boys', data || {}),
    assignDeliveryBoy: (data: any) => adminApi.post('/orders/assign-delivery-boy', data),
};

