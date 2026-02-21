import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white mt-auto">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 tracking-wider uppercase mb-6">Company</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/about" className="text-base text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-base text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 tracking-wider uppercase mb-6">Support</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/faq" className="text-base text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-base text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                                    Shipping
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 tracking-wider uppercase mb-6">Legal</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/privacy" className="text-base text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                                    Privacy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-base text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 transform duration-200">
                                    Terms
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-300 tracking-wider uppercase mb-6">Follow Us</h3>
                        <p className="text-base text-gray-400 mb-4">
                            Stay connected with us on social media for the latest updates and exclusive offers.
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-700 pt-8">
                    <p className="text-base text-gray-400 text-center">
                        &copy; {new Date().getFullYear()} <span className="font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Ecommerce</span>. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

