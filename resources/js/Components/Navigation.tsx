import { Link, usePage, router } from '@inertiajs/react';
import { 
    ShoppingCartIcon, 
    UserIcon, 
    Bars3Icon, 
    XMarkIcon,
    HomeIcon,
    Squares2X2Icon,
    TagIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/Pages/Auth/useAuthStore';
import { useCartStore } from '@/Pages/Cart/useCartStore';

const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: Squares2X2Icon },
    { name: 'Categories', href: '/categories', icon: TagIcon },
];

export default function Navigation() {
    const { auth, url } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        checkAuth();
        fetchCartCount();
        
        // Listen for storage changes (when login happens)
        const handleStorageChange = () => {
            checkAuth();
            fetchCartCount();
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Also check on focus (in case login happened in same tab)
        window.addEventListener('focus', checkAuth);
        window.addEventListener('focus', fetchCartCount);
        
        // Listen for cart updates
        const handleCartUpdate = () => {
            fetchCartCount();
        };
        
        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', checkAuth);
            window.removeEventListener('focus', fetchCartCount);
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        
        // First check localStorage for user data
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setLoading(false);
            } catch (error) {
                localStorage.removeItem('auth_user');
            }
        }
        
        // Then verify with API if token exists
        if (token) {
            try {
                const response = await useAuthStore.getUser();
                if (response.data?.status && response.data?.data) {
                    setUser(response.data.data);
                    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
                } else {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                    setUser(null);
                }
            } catch (error) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    const fetchCartCount = async () => {
        try {
            const response = await useCartStore.list();
            if (response.data?.status && response.data?.data?.items) {
                // Sum up all quantities to get total cart count
                const totalCount = response.data.data.items.reduce((sum: number, item: any) => {
                    return sum + (item.quantity || 0);
                }, 0);
                setCartCount(totalCount);
            } else {
                setCartCount(0);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
            setCartCount(0);
        }
    };

    const handleLogout = async () => {
        try {
            await useAuthStore.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Clear guest session on logout (backend will merge cart/recently viewed on login)
            localStorage.removeItem('guest_session_id');
            setUser(null);
            router.visit('/');
        }
    };

    // Use user from state if available, otherwise fall back to Inertia auth
    const currentUser = user || auth?.user;

    const isActive = (path) => {
        return url === path || url.startsWith(path + '/');
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">Ecommerce</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${
                                            isActive(item.href)
                                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                                : 'text-gray-900 hover:text-indigo-600'
                                        }`}
                                    >
                                        {Icon && <Icon className="h-5 w-5 mr-1" />}
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                        <Link
                            href="/cart"
                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 block min-w-[1rem] h-4 px-1 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                        {currentUser ? (
                            <div className="flex items-center space-x-2">
                                {currentUser.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                                        title="Admin Panel"
                                    >
                                        <ShieldCheckIcon className="h-6 w-6 mr-2" />
                                        <span className="hidden md:inline">Admin</span>
                                    </Link>
                                )}
                                <Link
                                    href="/orders"
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                                >
                                    <UserIcon className="h-6 w-6 mr-2" />
                                    <span className="hidden md:inline">{currentUser.name}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                                    title="Logout"
                                >
                                    <ArrowRightOnRectangleIcon className="h-6 w-6" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                    <div className="sm:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="sm:hidden border-t border-gray-200">
                    <div className="pt-2 pb-3 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center px-3 py-2 text-base font-medium transition-colors ${
                                        isActive(item.href)
                                            ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                    }`}
                                >
                                    {Icon && <Icon className="h-5 w-5 mr-3" />}
                                    {item.name}
                                </Link>
                            );
                        })}
                        <Link
                            href="/cart"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                        >
                            <ShoppingCartIcon className="h-5 w-5 mr-3" />
                            Cart
                            {cartCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-indigo-600 text-white text-xs">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                        {currentUser ? (
                            <>
                                {currentUser.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                    >
                                        <ShieldCheckIcon className="h-5 w-5 mr-3" />
                                        Admin Panel
                                    </Link>
                                )}
                                <Link
                                    href="/orders"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                >
                                    <UserIcon className="h-5 w-5 mr-3" />
                                    {currentUser.name}
                                </Link>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                >
                                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

