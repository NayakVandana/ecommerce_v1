import { Link, router } from '@inertiajs/react';
import { 
    HomeIcon,
    Squares2X2Icon,
    TagIcon,
    ShoppingBagIcon,
    ShoppingCartIcon,
    UsersIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    EyeIcon,
    CurrencyDollarIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    TicketIcon,
    SwatchIcon,
    EnvelopeIcon,
    UserGroupIcon,
    CubeIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/Pages/Auth/useAuthStore';
import { clearSession } from '@/utils/sessionStorage';

const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Revenue', href: '/admin/revenue', icon: CurrencyDollarIcon },
    { name: 'Products', href: '/admin/products', icon: Squares2X2Icon },
    { name: 'Categories', href: '/admin/categories', icon: TagIcon },
    { name: 'Fabrics', href: '/admin/fabrics', icon: SwatchIcon },
    { name: 'Stock Purchase', href: '/admin/stock-purchases', icon: CubeIcon },
    { name: 'Carts', href: '/admin/carts', icon: ShoppingCartIcon },
    { name: 'Recently Viewed', href: '/admin/recently-viewed', icon: EyeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Customers', href: '/admin/customers', icon: UserGroupIcon },
    { name: 'Contacts', href: '/admin/contacts', icon: EnvelopeIcon },
];

const couponManagementItems = [
    { name: 'All Coupons', href: '/admin/coupons' },
    { name: 'Usage History', href: '/admin/coupons/usage' },
];

const orderManagementItems = [
    { name: 'All Orders', href: '/admin/orders/all' },
    { name: 'Pending Orders', href: '/admin/orders/pending' },
    { name: 'Ready For Shipping', href: '/admin/orders/ready-for-shipping' },
    { name: 'Shipped Orders', href: '/admin/orders/shipped' },
    { name: 'Out for Delivery', href: '/admin/orders/out-for-delivery' },
    { name: 'Return & Refund', href: '/admin/orders/return-refund' },
    { name: 'Replacement', href: '/admin/orders/replacement' },
    { name: 'Delivered Orders', href: '/admin/orders/delivered' },
    { name: 'Failed Delivery', href: '/admin/orders/failed-delivery' },
    { name: 'Picked Up', href: '/admin/orders/picked-up' },
    { name: 'Completed', href: '/admin/orders/completed' },
    { name: 'Cancelled Orders', href: '/admin/orders/cancelled' },
    { name: 'Processed Orders', href: '/admin/orders/processed' },
    { name: 'Direct Orders', href: '/admin/orders/direct-orders' },
];

export default function AdminLayout({ children, currentPath }: any) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [orderManagementOpen, setOrderManagementOpen] = useState(true);
    const [couponManagementOpen, setCouponManagementOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
            } catch (error) {
                localStorage.removeItem('auth_user');
            }
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
            // Clear user state immediately
            setUser(null);
            // Force full page reload to ensure header updates
            window.location.href = '/';
        }
    };

    const isActive = (path: string) => {
        if (!currentPath) return false;
        if (path === '/admin') {
            return currentPath === '/admin';
        }
        return currentPath.startsWith(path);
    };

    const isOrderManagementActive = () => {
        if (!currentPath) return false;
        return currentPath.startsWith('/admin/orders');
    };

    const isCouponManagementActive = () => {
        if (!currentPath) return false;
        return currentPath.startsWith('/admin/coupons');
    };

    // Auto-expand order management if on an order page
    useEffect(() => {
        if (isOrderManagementActive()) {
            setOrderManagementOpen(true);
        }
        if (isCouponManagementActive()) {
            setCouponManagementOpen(true);
        }
    }, [currentPath]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                        <Link href="/admin" className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600">Admin Panel</span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {adminNavigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                        active
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                                    }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        
                        {/* Order Management Section */}
                        <div className="mt-2">
                            <button
                                onClick={() => setOrderManagementOpen(!orderManagementOpen)}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                    isOrderManagementActive()
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                                }`}
                            >
                                <div className="flex items-center">
                                    <ShoppingBagIcon className="h-5 w-5 mr-3" />
                                    Order Management
                                </div>
                                {orderManagementOpen ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                    <ChevronDownIcon className="h-4 w-4" />
                                )}
                            </button>
                            
                            {orderManagementOpen && (
                                <div className="mt-1 ml-4 space-y-1">
                                    {orderManagementItems.map((item) => {
                                        // Check if current path matches the item href exactly
                                        // Also handle default /admin/orders route as "All Orders"
                                        const active = currentPath === item.href || 
                                                      (item.href === '/admin/orders/all' && (currentPath === '/admin/orders' || currentPath === '/admin/orders/all'));
                                        
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                                                    active
                                                        ? 'bg-gray-100 text-indigo-600 font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                                }`}
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                <span className="ml-2">• {item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Coupon Management Section */}
                            <div className="mt-2">
                                <button
                                    onClick={() => setCouponManagementOpen(!couponManagementOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                        isCouponManagementActive()
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <TicketIcon className="h-5 w-5 mr-3" />
                                        Coupon Management
                                    </div>
                                    {couponManagementOpen ? (
                                        <ChevronUpIcon className="h-4 w-4" />
                                    ) : (
                                        <ChevronDownIcon className="h-4 w-4" />
                                    )}
                                </button>
                                
                                {couponManagementOpen && (
                                    <div className="mt-1 ml-4 space-y-1">
                                        {couponManagementItems.map((item) => {
                                            let active = false;
                                            if (item.href === '/admin/coupons/usage') {
                                                active = currentPath === '/admin/coupons/usage';
                                            } else {
                                                active = currentPath === item.href || 
                                                          (item.href === '/admin/coupons' && currentPath.startsWith('/admin/coupons') && !currentPath.includes('/usage'));
                                            }
                                            
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                                                        active
                                                            ? 'bg-gray-100 text-indigo-600 font-medium'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                                    }`}
                                                    onClick={() => setSidebarOpen(false)}
                                                >
                                                    <span className="ml-2">• {item.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </nav>

                    {/* User Section */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-indigo-600 font-semibold">
                                        {user?.name?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
                                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Link
                                href="/"
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <HomeIcon className="h-5 w-5 mr-3" />
                                Back to Site
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Bar */}
                <div className="sticky top-0 z-30 bg-white shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <div className="flex-1 flex justify-end">
                            <Link
                                href="/"
                                className="text-sm text-gray-600 hover:text-indigo-600"
                            >
                                View Site
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

