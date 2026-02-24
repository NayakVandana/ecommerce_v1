import { Skeleton } from './Skeleton';

interface CardSkeletonProps {
    count?: number;
}

export default function CardSkeleton({ count = 3 }: CardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            ))}
        </div>
    );
}

