import { api } from '@/utils/api';
import { isAuthenticated } from '@/utils/sessionStorage';

// Helper function to get the correct API path based on authentication status
const getRecentlyViewedPath = (path: string): string => {
    return isAuthenticated() ? `/auth/recently-viewed${path}` : `/recently-viewed${path}`;
};

export const useRecentlyViewedStore = {
    list: (data?: any) => api.post(getRecentlyViewedPath(''), data || {}),
    clear: (data?: any) => api.post(getRecentlyViewedPath('/clear'), data || {}),
    remove: (data: any) => api.post(getRecentlyViewedPath('/remove'), data),
};

