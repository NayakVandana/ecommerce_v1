import Navigation from '../../Components/Navigation';
import Footer from '../../Components/Footer';
import FlashMessage from '../../Components/FlashMessage';
import CartSidebar from '../../Components/CartSidebar';
import { useState, useEffect } from 'react';

export default function AppLayout({ children }: any) {
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const handleOpenCart = () => {
            setIsCartOpen(true);
        };
        
        window.addEventListener('openCart', handleOpenCart);
        return () => window.removeEventListener('openCart', handleOpenCart);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <FlashMessage />
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
}

