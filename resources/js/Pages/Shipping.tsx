import AppLayout from './Layouts/AppLayout';

export default function Shipping() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Shipping Information</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Shipping Options</h2>
                        <div className="space-y-4">
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <h3 className="font-semibold text-lg mb-2">Standard Shipping</h3>
                                <p className="text-gray-600 mb-2">5-7 business days</p>
                                <p className="text-gray-600">Free on orders over $50</p>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <h3 className="font-semibold text-lg mb-2">Express Shipping</h3>
                                <p className="text-gray-600 mb-2">2-3 business days</p>
                                <p className="text-gray-600">$15.00</p>
                            </div>
                            <div className="border-l-4 border-indigo-500 pl-4">
                                <h3 className="font-semibold text-lg mb-2">Overnight Shipping</h3>
                                <p className="text-gray-600 mb-2">Next business day</p>
                                <p className="text-gray-600">$25.00</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Processing Time</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Orders are typically processed within 1-2 business days. You will receive a confirmation 
                            email once your order has been shipped with tracking information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">International Shipping</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Currently, we ship within the United States only. International shipping options may be 
                            available for select items. Please contact us for more information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Tracking Your Order</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Once your order ships, you will receive an email with a tracking number. You can use this 
                            number to track your package on the carrier's website.
                        </p>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

