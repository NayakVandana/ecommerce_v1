import { cn } from '../../utils/cn';

interface SkeletonProps extends React.ComponentProps<"div"> {
    className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            data-slot="skeleton"
            className={cn("bg-gray-200 animate-pulse rounded-md", className)}
            {...props}
        />
    );
}

export { Skeleton };

