import AppLayout from './Layouts/AppLayout';

export default function About() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">About Us</h1>
                
                <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Welcome to Selorise! We are dedicated to providing you with the best products 
                            and exceptional customer service. Our mission is to make shopping easy, convenient, and enjoyable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to offer high-quality products at competitive prices while maintaining the highest 
                            standards of customer satisfaction. Your trust and satisfaction are our top priorities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>Wide selection of quality products</li>
                            <li>Fast and reliable shipping</li>
                            <li>Excellent customer support</li>
                            <li>Secure payment processing</li>
                            <li>Easy returns and exchanges</li>
                        </ul>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

