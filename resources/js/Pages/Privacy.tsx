import AppLayout from './Layouts/AppLayout';

export default function Privacy() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>Name and contact information</li>
                            <li>Payment information</li>
                            <li>Shipping address</li>
                            <li>Order history</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use the information we collect to process your orders, communicate with you about your 
                            purchases, and improve our services. We do not sell your personal information to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We implement appropriate security measures to protect your personal information. All payment 
                            transactions are encrypted and processed securely.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We use cookies to enhance your browsing experience and analyze site traffic. You can choose 
                            to disable cookies through your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at privacy@example.com.
                        </p>
                    </section>

                    <p className="text-sm text-gray-500 mt-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}

