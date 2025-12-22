import AppLayout from './Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import FormInput from '../Components/FormInput/FormInput';
import FormTextarea from '../Components/FormInput/FormTextarea';
import Button from '../Components/Button';

export default function Contact() {
    const { data, setData, post, processing, errors, setError } = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: any) => {
        e.preventDefault();
        
        const validationErrors: any = {};
        
        if (!data.name || data.name.trim() === '') {
            validationErrors.name = 'Enter Your name';
        }
        if (!data.email || data.email.trim() === '') {
            validationErrors.email = 'Enter Your email';
        }
        if (!data.subject || data.subject.trim() === '') {
            validationErrors.subject = 'Enter Your subject';
        }
        if (!data.message || data.message.trim() === '') {
            validationErrors.message = 'Enter Your message';
        }
        
        if (Object.keys(validationErrors).length > 0) {
            Object.keys(validationErrors).forEach((key) => {
                setError(key as any, validationErrors[key]);
            });
            return;
        }
        
        post('/contact', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                            <p className="text-gray-600 mb-4">
                                Have a question or need assistance? We're here to help!
                            </p>
                            <div className="space-y-3">
                                <p className="text-gray-600">
                                    <span className="font-semibold">Email:</span> support@example.com
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">Phone:</span> (555) 123-4567
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-semibold">Hours:</span> Mon-Fri 9am-5pm
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FormInput
                                label="Name"
                                id="name"
                                name="name"
                                type="text"
                                value={data.name}
                                onChange={(e: any) => setData('name', e.target.value)}
                                required
                                error={errors.name}
                            />

                            <FormInput
                                label="Email"
                                id="email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e: any) => setData('email', e.target.value)}
                                required
                                error={errors.email}
                            />

                            <FormInput
                                label="Subject"
                                id="subject"
                                name="subject"
                                type="text"
                                value={data.subject}
                                onChange={(e: any) => setData('subject', e.target.value)}
                                required
                                error={errors.subject}
                            />

                            <FormTextarea
                                label="Message"
                                id="message"
                                name="message"
                                rows={5}
                                value={data.message}
                                onChange={(e: any) => setData('message', e.target.value)}
                                required
                                error={errors.message}
                            />

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full"
                                size="lg"
                            >
                                {processing ? 'Sending...' : 'Send Message'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

