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
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/Pages/Auth/useAuthStore';
import { clearSession } from '@/utils/sessionStorage';

const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
    { name: 'Revenue', href: '/admin/revenue', icon: CurrencyDollarIcon },
    { name: 'Products', href: '/admin/products', icon: Squares2X2Icon },
    { name: 'Categories', href: '/admin/categories', icon: TagIcon },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
    { name: 'Carts', href: '/admin/carts', icon: ShoppingCartIcon },
    { name: 'Recently Viewed', href: '/admin/recently-viewed', icon: EyeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
];

export default function AdminLayout({ children, currentPath }: { children: React.ReactNode; currentPath?: string }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

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
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            // Clear session on logout (backend will create new session for next guest session)
            clearSession();
            router.visit('/');
        }
    };

    const isActive = (path: string) => {
        if (!currentPath) return false;
        if (path === '/admin') {
            return currentPath === '/admin';
        }
        return currentPath.startsWith(path);
    };

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

