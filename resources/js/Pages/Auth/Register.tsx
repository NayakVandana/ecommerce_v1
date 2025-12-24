import AppLayout from '../Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import FormInput from '../../Components/FormInput/FormInput';
import Button from '../../Components/Button';
import { useAuthStore } from './useAuthStore';

export default function Register() {
    const [data, setData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
        if (!data.name || data.name.trim() === '') {
            validationErrors.name = 'Enter Your name';
        }
        if (!data.email || data.email.trim() === '') {
            validationErrors.email = 'Enter Your email';
        }
        if (!data.password || data.password.trim() === '') {
            validationErrors.password = 'Enter Your password';
        }
        if (!data.password_confirmation || data.password_confirmation.trim() === '') {
            validationErrors.password_confirmation = 'Enter Your password confirmation';
        }
        if (data.password !== data.password_confirmation) {
            validationErrors.password_confirmation = 'Passwords do not match';
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        try {
            setProcessing(true);
            setErrors({});
            
            // Get session_id from localStorage to merge guest cart/recently viewed
            const sessionId = localStorage.getItem('guest_session_id');
            
            const response = await useAuthStore.register({
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                ...(sessionId && { session_id: sessionId }),
            });
            
            if (response.data?.status && response.data?.data?.token) {
                localStorage.setItem('auth_token', response.data.data.token);
                // Clear guest session_id after successful registration (cart/recently viewed merged to user account)
                if (sessionId) {
                    localStorage.removeItem('guest_session_id');
                }
                router.visit('/');
            }
        } catch (error: any) {
            if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                if (typeof errorMessage === 'object') {
                    setErrors(errorMessage);
                } else {
                    setErrors({ email: errorMessage });
                }
            } else {
                setErrors({ email: 'Registration failed. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                sign in to your existing account
                            </Link>
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <FormInput
                                label="Full Name"
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={data.name}
                                onChange={(e: any) => setData({ ...data, name: e.target.value })}
                                placeholder="John Doe"
                                error={errors.name}
                            />
                            <FormInput
                                label="Email address"
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={data.email}
                                onChange={(e: any) => setData({ ...data, email: e.target.value })}
                                placeholder="email@example.com"
                                error={errors.email}
                            />
                            <FormInput
                                label="Password"
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={data.password}
                                onChange={(e: any) => setData({ ...data, password: e.target.value })}
                                placeholder="Password"
                                error={errors.password}
                            />
                            <FormInput
                                label="Confirm Password"
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={data.password_confirmation}
                                onChange={(e: any) => setData({ ...data, password_confirmation: e.target.value })}
                                placeholder="Confirm Password"
                                error={errors.password_confirmation}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                                size="md"
                            >
                                {processing ? 'Creating account...' : 'Create account'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

