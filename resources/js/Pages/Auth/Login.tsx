import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FormInput from '../../Components/FormInput/FormInput';
import FormCheckbox from '../../Components/FormInput/FormCheckbox';
import Button from '../../Components/Button';
import { useAuthStore } from './useAuthStore';
import { getSessionId } from '../../utils/sessionStorage';

export default function Login() {
    const [data, setData] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
        if (!data.email || data.email.trim() === '') {
            validationErrors.email = 'Enter Your email address';
        } else {
            // Validate format: must be email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const trimmedValue = data.email.trim();
            
            if (!emailRegex.test(trimmedValue)) {
                validationErrors.email = 'Please enter a valid email address';
            }
        }
        if (!data.password || data.password.trim() === '') {
            validationErrors.password = 'Enter Your password';
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        try {
            setProcessing(true);
            setErrors({});
            
            // Get session_id from localStorage to merge guest cart/recently viewed
            const sessionId = getSessionId();
            
            const response = await useAuthStore.login({
                email: data.email,
                password: data.password,
                ...(sessionId && { session_id: sessionId }),
            });
            
            if (response.data?.status && response.data?.data?.token) {
                localStorage.setItem('auth_token', response.data.data.token);
                // Store user data for immediate header update
                if (response.data.data.user) {
                    localStorage.setItem('auth_user', JSON.stringify(response.data.data.user));
                }
                // Session_id will be updated by the API interceptor from response headers
                // No need to manually clear it - it will be associated with the user account
                // Force page reload to update header
                window.location.href = '/';
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                // Laravel validation errors
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                if (typeof errorMessage === 'object') {
                    setErrors(errorMessage);
                } else {
                    setErrors({ email: errorMessage });
                }
            } else {
                setErrors({ email: 'Login failed. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-6 sm:space-y-8">
                    <div>
                        <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-center text-xs sm:text-sm text-gray-600">
                            Or{' '}
                            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                create a new account
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <FormInput
                                label="Email Address"
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="username"
                                required
                                value={data.email}
                                onChange={(e: any) => setData({ ...data, email: e.target.value })}
                                placeholder="Email address"
                                error={errors.email}
                                helperText="Enter your registered email address"
                            />
                            <FormInput
                                label="Password"
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={data.password}
                                onChange={(e: any) => setData({ ...data, password: e.target.value })}
                                placeholder="Password"
                                error={errors.password}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <FormCheckbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onChange={(e: any) => setData({ ...data, remember: e.target.checked })}
                                label="Remember me"
                            />

                            <div className="text-sm">
                                <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                                size="md"
                            >
                                {processing ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

