/**
 * Session Storage Utility
 * Manages guest session_id in localStorage for cart and recently viewed products
 */

const SESSION_ID_KEY = 'guest_session_id';

/**
 * Get session ID from localStorage
 */
export const getSessionId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return localStorage.getItem(SESSION_ID_KEY);
};

/**
 * Set session ID in localStorage
 */
export const setSessionId = (sessionId: string): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(SESSION_ID_KEY, sessionId);
};

/**
 * Remove session ID from localStorage
 */
export const removeSessionId = (): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(SESSION_ID_KEY);
};

/**
 * Check if user is authenticated (has auth token)
 */
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    return !!localStorage.getItem('auth_token');
};

/**
 * Clear session when user logs out
 */
export const clearSession = (): void => {
    // Only clear guest session if user is logging out
    // Don't clear on page refresh
    if (isAuthenticated()) {
        removeSessionId();
    }
};

