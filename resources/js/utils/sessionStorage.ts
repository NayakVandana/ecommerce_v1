/**
 * Session Storage Utility
 * Manages session_id in localStorage for both authenticated and guest users
 * This helps track sessions correctly and prevent duplicate entries
 */

const SESSION_ID_KEY = 'session_id';
const OLD_SESSION_ID_KEY = 'guest_session_id'; // For backward compatibility

/**
 * Get session ID from localStorage
 * Migrates from old key if needed for backward compatibility
 */
export const getSessionId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    
    // Check for new key first
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    // If not found, check for old key and migrate
    if (!sessionId) {
        const oldSessionId = localStorage.getItem(OLD_SESSION_ID_KEY);
        if (oldSessionId) {
            // Migrate from old key to new key
            localStorage.setItem(SESSION_ID_KEY, oldSessionId);
            localStorage.removeItem(OLD_SESSION_ID_KEY);
            sessionId = oldSessionId;
        }
    }
    
    return sessionId;
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
    // Clear session_id when user logs out
    // This ensures a new session is created for the next guest session
    removeSessionId();
};

