import { Skeleton } from './Skeleton';

export default function ProductDetailSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="aspect-square rounded-lg w-full" />
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="aspect-square rounded-lg" />
                        ))}
                    </div>
                </div>
                
                {/* Product Info Skeleton */}
                <div className="space-y-6">
                    <div>
                        <Skeleton className="h-8 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2 mb-2" />
                        <Skeleton className="h-6 w-1/3" />
                    </div>
                    
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div>
                            <Skeleton className="h-4 w-24 mb-3" />
                            <div className="flex gap-2">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Skeleton key={index} className="h-10 w-10 rounded-full" />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <Skeleton className="h-4 w-24 mb-3" />
                            <div className="flex gap-2 flex-wrap">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <Skeleton key={index} className="h-10 w-16" />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <Skeleton className="h-4 w-24 mb-3" />
                            <div className="flex gap-2">
                                {Array.from({ length: 2 }).map((_, index) => (
                                    <Skeleton key={index} className="h-10 w-24" />
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 flex-1" />
                        <Skeleton className="h-12 w-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}

