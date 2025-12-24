import axios from 'axios';
import { getSessionId, setSessionId, isAuthenticated } from './sessionStorage';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add token and session_id to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add session_id to request data for POST requests
    // Only add if user is not authenticated (guest)
    if (!isAuthenticated()) {
        const sessionId = getSessionId();
        if (sessionId && config.data) {
            // If data is an object, add session_id to it
            if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
                config.data = {
                    ...config.data,
                    session_id: sessionId,
                };
            }
        }
    }
    
    return config;
});

// Handle response errors and extract session_id
api.interceptors.response.use(
    (response) => {
        // Extract session_id from response headers or data
        // Axios normalizes headers to lowercase
        const sessionIdFromHeader = response.headers['x-session-id'] || response.headers['X-Session-ID'];
        const sessionIdFromData = response.data?.data?.session_id || response.data?.session_id;
        
        // Store session_id if present and user is not authenticated
        if (!isAuthenticated()) {
            const sessionId = sessionIdFromHeader || sessionIdFromData;
            if (sessionId) {
                setSessionId(sessionId);
            }
        }
        
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            // Don't clear session_id on 401, as user might be a guest
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export { api };

