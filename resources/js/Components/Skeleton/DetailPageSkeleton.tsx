import { Skeleton } from './Skeleton';

export default function DetailPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center space-x-4">
                <Skeleton className="h-6 w-6" />
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Sidebar Skeleton */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex flex-col items-center text-center mb-6">
                            <Skeleton className="h-24 w-24 rounded-full mb-4" />
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="space-y-4 border-t border-gray-200 pt-6">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="flex items-start">
                                    <Skeleton className="h-5 w-5 mr-3" />
                                    <div className="flex-1">
                                        <Skeleton className="h-3 w-16 mb-2" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Right Content Skeleton */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg p-6">
                        <Skeleton className="h-6 w-32 mb-6" />
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between mb-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

