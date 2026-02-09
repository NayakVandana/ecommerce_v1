import AppLayout from '../Layouts/AppLayout';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../Auth/useAuthStore';
import Button from '../../Components/Button';
import AlertModal from '../../Components/AlertModal';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function ProfileIndex() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('error');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await useAuthStore.getUser();
            if (response.data?.status && response.data?.data) {
                const userData = response.data.data.user || response.data.data;
                setUser(userData);
                setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    password: '',
                    password_confirmation: '',
                });
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setErrors({});

        try {
            const updateData: any = {};
            
            if (formData.name !== user.name) {
                updateData.name = formData.name;
            }
            
            if (formData.email !== user.email) {
                updateData.email = formData.email;
            }
            
            if (formData.password) {
                if (formData.password.length < 8) {
                    setErrors({ password: 'Password must be at least 8 characters' });
                    setUpdating(false);
                    return;
                }
                if (formData.password !== formData.password_confirmation) {
                    setErrors({ password_confirmation: 'Passwords do not match' });
                    setUpdating(false);
                    return;
                }
                updateData.password = formData.password;
                updateData.password_confirmation = formData.password_confirmation;
            }

            const response = await useAuthStore.updateProfile(updateData);
            
            if (response.data?.status) {
                await fetchUser();
                setAlertMessage('Profile updated successfully');
                setAlertType('success');
                setShowAlert(true);
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    password_confirmation: '',
                }));
            } else {
                setAlertMessage(response.data?.message || 'Failed to update profile');
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error: any) {
            console.error('Error updating profile:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            setAlertMessage(error.response?.data?.message || 'Failed to update profile');
            setAlertType('error');
            setShowAlert(true);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-500">Loading profile...</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <UserIcon className="h-5 w-5 inline mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your full name"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <EnvelopeIcon className="h-5 w-5 inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    errors.email ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Enter your email"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Section */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                <LockClosedIcon className="h-5 w-5 inline mr-2" />
                                Change Password (Optional)
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Leave blank if you don't want to change your password
                            </p>

                            <div className="space-y-4">
                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.password ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter new password (min 8 characters)"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password_confirmation"
                                        value={formData.password_confirmation}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Confirm new password"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={updating}
                            >
                                {updating ? 'Updating...' : 'Update Profile'}
                            </Button>
                        </div>
                    </form>
                </div>

                <AlertModal
                    isOpen={showAlert}
                    onClose={() => setShowAlert(false)}
                    title={alertType === 'success' ? 'Success' : 'Error'}
                    message={alertMessage}
                    type={alertType}
                />
            </div>
        </AppLayout>
    );
}

