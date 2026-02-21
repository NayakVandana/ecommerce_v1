import AppLayout from '../Layouts/AppLayout';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import FormInput from '../../Components/FormInput/FormInput';
import Button from '../../Components/Button';
import { useAuthStore } from './useAuthStore';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function ResetPassword() {
    const { url } = usePage();
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const tokenFromUrl = urlParams.get('token') || '';
    const emailFromUrl = urlParams.get('email') || '';

    const [data, setData] = useState({
        token: tokenFromUrl,
        email: emailFromUrl,
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [invalidToken, setInvalidToken] = useState(false);

    useEffect(() => {
        if (!tokenFromUrl || !emailFromUrl) {
            setInvalidToken(true);
        }
    }, [tokenFromUrl, emailFromUrl]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
        if (!data.token || data.token.trim() === '') {
            validationErrors.token = 'Reset token is required';
        }
        if (!data.email || data.email.trim() === '') {
            validationErrors.email = 'Email is required';
        }
        if (!data.password || data.password.trim() === '') {
            validationErrors.password = 'Enter Your password';
        } else if (data.password.length < 8) {
            validationErrors.password = 'Password must be at least 8 characters';
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
            
            const response = await useAuthStore.resetPassword({
                token: data.token,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            
            if (response.data?.status) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.visit('/login');
                }, 3000);
            } else {
                setErrors({ password: response.data?.message || 'Failed to reset password. Please try again.' });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                const errorMessage = error.response.data.message;
                if (typeof errorMessage === 'object') {
                    setErrors(errorMessage);
                } else {
                    setErrors({ password: errorMessage });
                }
            } else {
                setErrors({ password: 'Failed to reset password. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (invalidToken) {
        return (
            <AppLayout>
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircleIcon className="h-8 w-8 text-red-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-red-900 mb-2">
                                Invalid Reset Link
                            </h3>
                            <p className="text-sm text-red-700 mb-4">
                                The password reset link is invalid or missing required parameters. Please request a new password reset link.
                            </p>
                            <Link
                                href="/forgot-password"
                                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Request New Reset Link
                            </Link>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (success) {
        return (
            <AppLayout>
                <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-green-900 mb-2">
                                Password Reset Successful!
                            </h3>
                            <p className="text-sm text-green-700 mb-4">
                                Your password has been reset successfully. You will be redirected to the login page shortly.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Go to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Reset Your Password
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your new password below.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <FormInput
                                label="Email"
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={data.email}
                                onChange={(e: any) => setData({ ...data, email: e.target.value })}
                                placeholder="Email address"
                                error={errors.email}
                                className="bg-gray-50"
                                readOnly
                            />
                            <FormInput
                                label="New Password"
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={data.password}
                                onChange={(e: any) => setData({ ...data, password: e.target.value })}
                                placeholder="Enter new password"
                                error={errors.password}
                                helperText="Password must be at least 8 characters"
                            />
                            <FormInput
                                label="Confirm New Password"
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={data.password_confirmation}
                                onChange={(e: any) => setData({ ...data, password_confirmation: e.target.value })}
                                placeholder="Confirm new password"
                                error={errors.password_confirmation}
                            />
                            <input
                                type="hidden"
                                name="token"
                                value={data.token}
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                                size="md"
                            >
                                {processing ? 'Resetting Password...' : 'Reset Password'}
                            </Button>
                        </div>

                        <div className="text-center">
                            <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

