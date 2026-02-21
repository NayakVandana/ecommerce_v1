import AppLayout from './Layouts/AppLayout';
import { useState } from 'react';
import FormInput from '../Components/FormInput/FormInput';
import FormTextarea from '../Components/FormInput/FormTextarea';
import Button from '../Components/Button';
import { EnvelopeIcon, PhoneIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import toast from '../utils/toast';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [errors, setErrors] = useState<any>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: null }));
        }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
        if (!formData.name || formData.name.trim() === '') {
            validationErrors.name = 'Enter Your name';
        }
        if (!formData.email || formData.email.trim() === '') {
            validationErrors.email = 'Enter Your email';
        }
        if (!formData.subject || formData.subject.trim() === '') {
            validationErrors.subject = 'Enter Your subject';
        }
        if (!formData.message || formData.message.trim() === '') {
            validationErrors.message = 'Enter Your message';
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        try {
            setProcessing(true);
            const response = await api.post('/contact', formData);
            
            if (response.data?.status) {
                toast({ type: 'success', message: response.data.message || 'Thank you for contacting us! We will get back to you soon.' });
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                });
                setErrors({});
            } else {
                toast({ type: 'error', message: response.data?.message || 'Something went wrong. Please try again.' });
            }
        } catch (error: any) {
            console.error('Contact form error:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast({ type: 'error', message: error.response?.data?.message || 'Failed to send message. Please try again.' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppLayout>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
                        <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                            Have a question or need assistance? We're here to help! Reach out to us and we'll respond as soon as possible.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Contact Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="bg-indigo-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                                <EnvelopeIcon className="h-7 w-7 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                            <p className="text-gray-600 text-sm">support@example.com</p>
                            <p className="text-gray-600 text-sm">info@example.com</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="bg-indigo-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                                <PhoneIcon className="h-7 w-7 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                            <p className="text-gray-600 text-sm">+1 (555) 123-4567</p>
                            <p className="text-gray-600 text-sm">+1 (555) 987-6543</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="bg-indigo-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                                <ClockIcon className="h-7 w-7 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h3>
                            <p className="text-gray-600 text-sm">Mon - Fri: 9:00 AM - 6:00 PM</p>
                            <p className="text-gray-600 text-sm">Sat: 10:00 AM - 4:00 PM</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="bg-indigo-100 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                                <MapPinIcon className="h-7 w-7 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Us</h3>
                            <p className="text-gray-600 text-sm">123 Business Street</p>
                            <p className="text-gray-600 text-sm">City, State 12345</p>
                        </div>
                    </div>

                    {/* Contact Form Section */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">Send us a Message</h2>
                                <p className="text-gray-600">Fill out the form below and we'll get back to you within 24 hours.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput
                                        label="Your Name"
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e: any) => handleChange('name', e.target.value)}
                                        required
                                        error={errors.name}
                                        className="w-full"
                                    />

                                    <FormInput
                                        label="Your Email"
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e: any) => handleChange('email', e.target.value)}
                                        required
                                        error={errors.email}
                                        className="w-full"
                                    />
                                </div>

                                <FormInput
                                    label="Subject"
                                    id="subject"
                                    name="subject"
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e: any) => handleChange('subject', e.target.value)}
                                    required
                                    error={errors.subject}
                                    className="w-full"
                                />

                                <FormTextarea
                                    label="Your Message"
                                    id="message"
                                    name="message"
                                    rows={6}
                                    value={formData.message}
                                    onChange={(e: any) => handleChange('message', e.target.value)}
                                    required
                                    error={errors.message}
                                    className="w-full"
                                />

                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                                        size="lg"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (
                                            'Send Message'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

