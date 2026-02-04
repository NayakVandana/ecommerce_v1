import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configure axios (used by Inertia) to send token with requests
axios.defaults.headers.common['X-Auth-Token'] = localStorage.getItem('auth_token') || '';

// Update token in headers when it changes
const updateAuthToken = () => {
    const token = localStorage.getItem('auth_token');
    axios.defaults.headers.common['X-Auth-Token'] = token || '';
};

// Listen for storage changes to update token
window.addEventListener('storage', updateAuthToken);

// Update token on page load
updateAuthToken();

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <ToastContainer />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

