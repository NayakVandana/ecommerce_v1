import { Skeleton } from './Skeleton';

export default function CategoryListSkeleton() {
    return (
        <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 py-2">
                    <Skeleton className="h-4 flex-1" style={{ marginLeft: `${(index % 3) * 20}px` }} />
                </div>
            ))}
        </div>
    );
}

