import AppLayout from './Layouts/AppLayout';
import { useState } from 'react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = [
        {
            question: 'How do I place an order?',
            answer: 'Simply browse our products, add items to your cart, and proceed to checkout. Follow the steps to complete your purchase.',
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards, debit cards, and PayPal. All payments are processed securely.',
        },
        {
            question: 'How long does shipping take?',
            answer: 'Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout.',
        },
        {
            question: 'Can I return or exchange items?',
            answer: 'Yes! We offer a 30-day return policy. Items must be in original condition with tags attached.',
        },
        {
            question: 'Do you ship internationally?',
            answer: 'Currently, we ship within the United States. International shipping options may be available for select items.',
        },
        {
            question: 'How can I track my order?',
            answer: 'Once your order ships, you will receive a tracking number via email. You can use this to track your package.',
        },
    ];

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
                
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                            >
                                <span className="font-semibold text-lg">{faq.question}</span>
                                <span className="text-gray-400">
                                    {openIndex === index ? '−' : '+'}
                                </span>
                            </button>
                            {openIndex === index && openIndex >= 0 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

