import AppLayout from './Layouts/AppLayout';

export default function Terms() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing and using this website, you accept and agree to be bound by the terms and 
                            provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Use License</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Permission is granted to temporarily access the materials on our website for personal, 
                            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, 
                            and under this license you may not:
                        </p>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>Modify or copy the materials</li>
                            <li>Use the materials for any commercial purpose</li>
                            <li>Attempt to reverse engineer any software contained on the website</li>
                            <li>Remove any copyright or other proprietary notations from the materials</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Product Information</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to provide accurate product descriptions and images. However, we do not warrant that 
                            product descriptions or other content on this site is accurate, complete, reliable, current, 
                            or error-free.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Pricing</h2>
                        <p className="text-gray-600 leading-relaxed">
                            All prices are subject to change without notice. We reserve the right to modify prices at any 
                            time. In the event of a pricing error, we reserve the right to cancel orders placed at the 
                            incorrect price.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Returns and Refunds</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Please review our return policy. Items must be returned within 30 days of purchase in original 
                            condition with tags attached for a full refund.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            In no event shall our company or its suppliers be liable for any damages arising out of the use 
                            or inability to use the materials on our website.
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

