import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {Array.from({ length: columns }).map((_, index) => (
                            <th key={index} className="px-6 py-3">
                                <Skeleton className="h-4 w-24" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-4" style={{ width: `${Math.random() * 40 + 60}%` }} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

