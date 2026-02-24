import { Skeleton } from './Skeleton';

export default function CategoryPageSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Skeleton */}
                <div className="mb-6">
                    <Skeleton className="h-4 w-48" />
                </div>
                
                {/* Category Header Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-4 w-96" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Filters Skeleton */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 space-y-6">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index}>
                                    <Skeleton className="h-5 w-32 mb-4" />
                                    <div className="space-y-2">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-4 w-full" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Products Grid Skeleton */}
                    <div className="lg:col-span-3">
                        <div className="mb-6 flex justify-between items-center">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-10 w-48" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 9 }).map((_, index) => (
                                <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                                    <Skeleton className="aspect-square w-full" />
                                    <div className="p-4">
                                        <Skeleton className="h-4 w-3/4 mb-3" />
                                        <Skeleton className="h-4 w-1/2 mb-2" />
                                        <Skeleton className="h-6 w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

