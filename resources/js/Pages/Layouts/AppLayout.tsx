import Navigation from '../../Components/Navigation';
import Footer from '../../Components/Footer';
import FlashMessage from '../../Components/FlashMessage';

export default function AppLayout({ children }: any) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navigation />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <FlashMessage />
        </div>
    );
}

