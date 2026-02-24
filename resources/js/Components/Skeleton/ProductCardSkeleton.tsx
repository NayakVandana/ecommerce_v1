import { Skeleton } from './Skeleton';

interface ProductCardSkeletonProps {
    count?: number;
}

export default function ProductCardSkeleton({ count = 8 }: ProductCardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, index) => (
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
    );
}

