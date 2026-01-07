import { Link } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
    data: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
        links?: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    onPageChange?: (page: number) => void;
    baseUrl?: string;
    queryParams?: Record<string, string>;
}

export default function Pagination({ data, onPageChange, baseUrl, queryParams }: PaginationProps) {
    if (!data || data.last_page <= 1) {
        return null;
    }

    const { current_page, last_page, links } = data;

    const buildUrl = (page: number) => {
        if (onPageChange) {
            return '#';
        }
        
        if (baseUrl) {
            const url = new URL(baseUrl, window.location.origin);
            url.searchParams.set('page', page.toString());
            if (queryParams) {
                Object.entries(queryParams).forEach(([key, value]) => {
                    if (value) {
                        url.searchParams.set(key, value);
                    }
                });
            }
            return url.pathname + url.search;
        }
        
        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value) {
                    url.searchParams.set(key, value);
                }
            });
        }
        return url.pathname + url.search;
    };

    const handlePageClick = (page: number, e: React.MouseEvent) => {
        if (onPageChange) {
            e.preventDefault();
            onPageChange(page);
        }
    };

    const renderPageLink = (page: number | null, label: string, isActive: boolean = false) => {
        if (page === null || page === current_page) {
            return (
                <span
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        isActive
                            ? 'z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                >
                    {label}
                </span>
            );
        }

        const url = buildUrl(page);
        const Component = onPageChange ? 'button' : Link;
        const props = onPageChange
            ? {
                  onClick: (e: React.MouseEvent) => handlePageClick(page, e),
                  className: 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              }
            : {
                  href: url,
                  className: 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              };

        return <Component {...props}>{label}</Component>;
    };

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | null)[] = [];
        const maxPagesToShow = 7;
        
        if (last_page <= maxPagesToShow) {
            // Show all pages
            for (let i = 1; i <= last_page; i++) {
                pages.push(i);
            }
        } else {
            // Show first page
            pages.push(1);
            
            if (current_page > 3) {
                pages.push(null); // Ellipsis
            }
            
            // Show pages around current page
            const start = Math.max(2, current_page - 1);
            const end = Math.min(last_page - 1, current_page + 1);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (current_page < last_page - 2) {
                pages.push(null); // Ellipsis
            }
            
            // Show last page
            pages.push(last_page);
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
                {current_page > 1 ? (
                    <Link
                        href={buildUrl(current_page - 1)}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Previous
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                        Previous
                    </span>
                )}
                {current_page < last_page ? (
                    <Link
                        href={buildUrl(current_page + 1)}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Next
                    </Link>
                ) : (
                    <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                        Next
                    </span>
                )}
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{data.from || 0}</span> to{' '}
                        <span className="font-medium">{data.to || 0}</span> of{' '}
                        <span className="font-medium">{data.total}</span> results
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        {current_page > 1 ? (
                            <Link
                                href={buildUrl(current_page - 1)}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 cursor-not-allowed opacity-50">
                                <span className="sr-only">Previous</span>
                                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}

                        {pageNumbers.map((page, index) => {
                            if (page === null) {
                                return (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                                    >
                                        ...
                                    </span>
                                );
                            }
                            return (
                                <span key={page}>
                                    {renderPageLink(page, page.toString(), page === current_page)}
                                </span>
                            );
                        })}

                        {current_page < last_page ? (
                            <Link
                                href={buildUrl(current_page + 1)}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                        ) : (
                            <span className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 cursor-not-allowed opacity-50">
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
}

