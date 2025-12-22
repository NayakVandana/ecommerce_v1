import { Link } from '@inertiajs/react';

export default function Footer() {
    return (
        <footer className="bg-white border-t mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Company</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/about" className="text-base text-gray-500 hover:text-gray-900 transition-colors">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-base text-gray-500 hover:text-gray-900 transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Support</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/faq" className="text-base text-gray-500 hover:text-gray-900 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-base text-gray-500 hover:text-gray-900 transition-colors">
                                    Shipping
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900 transition-colors">
                                    Privacy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-base text-gray-500 hover:text-gray-900 transition-colors">
                                    Terms
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Follow Us</h3>
                        <p className="text-base text-gray-500">
                            Stay connected with us on social media.
                        </p>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-8">
                    <p className="text-base text-gray-400 text-center">
                        &copy; {new Date().getFullYear()} Ecommerce. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}

