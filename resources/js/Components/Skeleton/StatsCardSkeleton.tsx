import { Skeleton } from './Skeleton';

interface StatsCardSkeletonProps {
    count?: number;
}

export default function StatsCardSkeleton({ count = 3 }: StatsCardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Skeleton className="h-12 w-12 rounded-full" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-32" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

