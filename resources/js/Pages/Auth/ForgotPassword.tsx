import AppLayout from '../Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import FormInput from '../../Components/FormInput/FormInput';
import Button from '../../Components/Button';
import { useAuthStore } from './useAuthStore';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword() {
    const [data, setData] = useState({
        email: '',
        otp: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [passwordReset, setPasswordReset] = useState(false);
    const [verificationToken, setVerificationToken] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);

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
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        try {
            setProcessing(true);
            setErrors({});
            
            const response = await useAuthStore.forgotPassword({
                email: data.email.trim(),
            });
            
            if (response.data?.status) {
                setOtpSent(true);
                setVerificationToken(response.data.data?.verification_token || null);
                setUserEmail(response.data.data?.email || null);
                setResendCooldown(60); // Start 60 second cooldown
                
                // In development, log the OTP
                if (response.data.data?.otp && import.meta.env.DEV) {
                    console.log('Password Reset OTP:', response.data.data.otp);
                    console.log('Verification Token:', response.data.data.verification_token);
                }
            } else {
                setErrors({ email: response.data?.message || 'Failed to send OTP. Please try again.' });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ email: error.response.data.message });
            } else {
                setErrors({ email: 'Failed to send reset link. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleVerifyOtp = async (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
        if (!data.otp || data.otp.trim() === '') {
            validationErrors.otp = 'Enter the OTP';
        } else if (!/^\d{6}$/.test(data.otp.trim())) {
            validationErrors.otp = 'OTP must be 6 digits';
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        try {
            setProcessing(true);
            setErrors({});
            
            const response = await useAuthStore.verifyOtp({
                verification_token: verificationToken,
                otp: data.otp.trim(),
                email: userEmail,
            });
            
            if (response.data?.status) {
                setOtpVerified(true);
            } else {
                setErrors({ otp: response.data?.message || 'Invalid OTP. Please try again.' });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ otp: error.response.data.message });
            } else {
                setErrors({ otp: 'Failed to verify OTP. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || resending) return;
        
        try {
            setResending(true);
            setErrors({});
            
            const response = await useAuthStore.resendOtp({
                email: data.email.trim(),
            });
            
            if (response.data?.status) {
                setVerificationToken(response.data.data?.verification_token || null);
                setUserEmail(response.data.data?.email || null);
                setResendCooldown(60); // Start 60 second cooldown
                setData({ ...data, otp: '' }); // Clear OTP input
                
                // In development, log the OTP
                if (response.data.data?.otp && import.meta.env.DEV) {
                    console.log('Password Reset OTP (Resent):', response.data.data.otp);
                    console.log('Verification Token:', response.data.data.verification_token);
                }
            } else {
                setErrors({ otp: response.data?.message || 'Failed to resend OTP. Please try again.' });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ otp: error.response.data.message });
            } else {
                setErrors({ otp: 'Failed to resend OTP. Please try again.' });
            }
        } finally {
            setResending(false);
        }
    };

    // Countdown timer for resend OTP
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleResetPassword = async (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
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
                verification_token: verificationToken,
                email: userEmail,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            
            if (response.data?.status) {
                setPasswordReset(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = '/login';
                }, 3000);
            } else {
                setErrors({ password: response.data?.message || 'Failed to reset password. Please try again.' });
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                setErrors({ password: error.response.data.message });
            } else {
                setErrors({ password: 'Failed to reset password. Please try again.' });
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
                            Forgot your password?
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {passwordReset
                                ? "Password reset successfully! Redirecting to login..."
                                : !otpSent 
                                ? "No worries! Enter your email address and we'll send you an OTP to reset your password."
                                : otpVerified
                                ? "Enter your new password below."
                                : "We've sent a 6-digit OTP to your email. Please enter it below."
                            }
                        </p>
                    </div>

                    {passwordReset ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
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
                                className="inline-block text-sm font-medium text-green-600 hover:text-green-700"
                            >
                                Go to Login Now
                            </Link>
                        </div>
                    ) : otpVerified ? (
                        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                            <div className="space-y-4">
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
                    ) : otpSent ? (
                        <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
                            <div className="space-y-4">
                                <FormInput
                                    label="Enter OTP"
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    value={data.otp}
                                    onChange={(e: any) => {
                                        // Only allow digits, limit to 6
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setData({ ...data, otp: value });
                                    }}
                                    placeholder="000000"
                                    error={errors.otp}
                                    helperText="Enter the 6-digit OTP sent to your email"
                                    className="text-center text-2xl tracking-widest font-bold"
                                />
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                    size="md"
                                >
                                    {processing ? 'Verifying...' : 'Verify OTP'}
                                </Button>
                            </div>

                            <div className="text-center space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm text-gray-600">Didn't receive OTP?</span>
                                    {resendCooldown > 0 ? (
                                        <span className="text-sm text-gray-500">
                                            Resend in {resendCooldown}s
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resending}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {resending ? 'Sending...' : 'Resend OTP'}
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setData({ ...data, otp: '' });
                                        setErrors({});
                                        setResendCooldown(0);
                                    }}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Change email
                                </button>
                                <div>
                                    <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        Back to Login
                                    </Link>
                                </div>
                            </div>
                        </form>
                    ) : (
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
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full"
                                    size="md"
                                >
                                    {processing ? 'Sending OTP...' : 'Send OTP'}
                                </Button>
                            </div>

                            <div className="text-center">
                                <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    Remember your password? Sign in
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

