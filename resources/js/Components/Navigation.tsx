import { Link, usePage, router } from '@inertiajs/react';
import { 
    ShoppingCartIcon, 
    UserIcon, 
    Bars3Icon, 
    XMarkIcon,
    TagIcon,
    ArrowRightOnRectangleIcon,
    ShieldCheckIcon,
    TruckIcon,
    ShoppingBagIcon,
    MapPinIcon,
    ChevronDownIcon,
    HeartIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/Pages/Auth/useAuthStore';
import { useCartStore } from '@/Pages/Cart/useCartStore';
import { useWishlistStore } from '@/Pages/Wishlist/useWishlistStore';
import { clearSession } from '@/utils/sessionStorage';

const navigation = [
];

export default function Navigation() {
    const { auth, url } = usePage().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [wishlistCount, setWishlistCount] = useState(0);

    useEffect(() => {
        checkAuth();
        fetchCartCount();
        fetchWishlistCount();
        
        // Listen for storage changes (when login happens)
        const handleStorageChange = () => {
            checkAuth();
            fetchCartCount();
            fetchWishlistCount();
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Also check on focus (in case login happened in same tab)
        window.addEventListener('focus', checkAuth);
        window.addEventListener('focus', fetchCartCount);
        window.addEventListener('focus', fetchWishlistCount);
        
        // Listen for cart updates
        const handleCartUpdate = () => {
            fetchCartCount();
        };
        
        // Listen for wishlist updates
        const handleWishlistUpdate = () => {
            fetchWishlistCount();
        };
        
        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('wishlistUpdated', handleWishlistUpdate);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', checkAuth);
            window.removeEventListener('focus', fetchCartCount);
            window.removeEventListener('focus', fetchWishlistCount);
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
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

    const fetchWishlistCount = async () => {
        try {
            const response = await useWishlistStore.list();
            if (response.data?.status && response.data?.data?.count !== undefined) {
                setWishlistCount(response.data.data.count);
            } else {
                setWishlistCount(0);
            }
        } catch (error) {
            console.error('Error fetching wishlist count:', error);
            setWishlistCount(0);
        }
    };

    const handleLogout = async () => {
        try {
            await useAuthStore.logout();
        } catch (error: any) {
            // Log error but don't block logout - continue with local cleanup
            // 429 (rate limit) or other errors shouldn't prevent logout
            if (error.response?.status !== 429) {
                console.error('Logout error:', error);
            }
        } finally {
            // Always clear local storage and redirect, even if API call fails
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Clear session on logout (backend will create new session for next guest session)
            clearSession();
            // Clear user state and counts immediately
            setUser(null);
            setCartCount(0);
            setWishlistCount(0);
            // Force full page reload to ensure header updates
            window.location.href = '/';
        }
    };

    // Use user from state if available, otherwise fall back to Inertia auth
    const currentUser = user || auth?.user;

    const isActive = (path) => {
        return url === path || url.startsWith(path + '/');
    };

    return (
        <nav className="bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex">
                        <Link href="/" className="flex items-center group">
                            <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:to-purple-700 transition-all">
                                Ecommerce
                            </span>
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
                            href="/wishlist"
                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"
                            title="Wishlist"
                        >
                            <HeartIcon className="h-6 w-6" />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 block min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                                    {wishlistCount > 99 ? '99+' : wishlistCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/cart"
                            className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all rounded-lg hover:bg-indigo-50"
                        >
                            <ShoppingCartIcon className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 block min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-lg">
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
                                {currentUser.role === 'delivery_boy' && (
                                    <Link
                                        href="/delivery-boy"
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                                        title="Delivery Dashboard"
                                    >
                                        <TruckIcon className="h-6 w-6 mr-2" />
                                        <span className="hidden md:inline">Delivery</span>
                                    </Link>
                                )}
                                
                                {/* User Menu Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                                    >
                                        <UserIcon className="h-6 w-6 mr-2" />
                                        <span className="hidden md:inline">{currentUser.name}</span>
                                        <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {userMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setUserMenuOpen(false)}
                                            ></div>
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                                                <Link
                                                    href="/orders"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <ShoppingBagIcon className="h-5 w-5 mr-2" />
                                                    Orders
                                                </Link>
                                                <Link
                                                    href="/profile"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <UserIcon className="h-5 w-5 mr-2" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    href="/addresses"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <MapPinIcon className="h-5 w-5 mr-2" />
                                                    Your Addresses
                                                </Link>
                                                <div className="border-t border-gray-200 my-1"></div>
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        handleLogout();
                                                    }}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                >
                                                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                                                    Logout
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                        <Link
                            href="/login"
                            className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
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
                            href="/wishlist"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                        >
                            <HeartIcon className="h-5 w-5 mr-3" />
                            Wishlist
                            {wishlistCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-xs">
                                    {wishlistCount > 99 ? '99+' : wishlistCount}
                                </span>
                            )}
                        </Link>
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

