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
    
    // Add session_id to request for guest users
    // Only add if user is not authenticated (guest)
    if (!isAuthenticated()) {
        const sessionId = getSessionId();
        if (sessionId) {
            // Add session_id to request data for POST/PUT/PATCH requests
            if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
                config.data = {
                    ...config.data,
                    session_id: sessionId,
                };
            }
            // Add session_id to query params for GET/DELETE requests
            else if (config.method === 'get' || config.method === 'delete') {
                config.params = {
                    ...config.params,
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
        // Only set if we don't already have one (to prevent overwriting with new sessions)
        if (!isAuthenticated()) {
            const existingSessionId = getSessionId();
            const sessionId = sessionIdFromHeader || sessionIdFromData;
            
            // Only set session_id if:
            // 1. We received one from the backend
            // 2. We don't already have one stored, OR the received one matches what we have
            if (sessionId) {
                if (!existingSessionId) {
                    // No existing session_id, store the new one
                    setSessionId(sessionId);
                } else if (sessionId === existingSessionId) {
                    // Session ID matches, no need to update (but this confirms it's still valid)
                    // Optionally, we could update last activity timestamp here
                }
                // If sessionId !== existingSessionId, don't overwrite - keep the existing one
                // This prevents creating multiple sessions
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

