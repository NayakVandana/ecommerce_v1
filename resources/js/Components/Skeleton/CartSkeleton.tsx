import { Skeleton } from './Skeleton';

export default function CartSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items Skeleton */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="flex gap-4 pb-6 border-b border-gray-200 last:border-0">
                                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-24" />
                                        <Skeleton className="h-6 w-20" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Order Summary Skeleton */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <Skeleton className="h-6 w-32 mb-6" />
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                        <div className="border-t border-gray-200 pt-4 mb-6">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

