import { Skeleton } from './Skeleton';

export default function WishlistSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                        <Skeleton className="aspect-square w-full" />
                        <div className="p-4">
                            <Skeleton className="h-4 w-3/4 mb-3" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-6 w-1/3 mb-4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-10 flex-1" />
                                <Skeleton className="h-10 w-10" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

