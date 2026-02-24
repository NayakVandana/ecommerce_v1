import { Skeleton } from './Skeleton';

export default function DeliveryBoySkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                ))}
            </div>
            
            {/* Orders List Skeleton */}
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

