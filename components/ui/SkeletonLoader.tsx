
"use client";

// components/ui/SkeletonLoader.tsx
import React from 'react';

const SkeletonLoader = ({ className = 'h-4 bg-gray-700 rounded w-3/4' }: { className?: string }) => {
    return <div className={`animate-pulse ${className}`} />;
};

export default SkeletonLoader;

interface SkeletonListProps {
    count: number;
    itemClassName?: string;
    containerClassName?: string;
}

export const SkeletonList = ({ count, itemClassName, containerClassName }: SkeletonListProps) => {
    return (
        <div className={containerClassName || "space-y-3"}>
            {[...Array(count)].map((_, i) => (
                <SkeletonLoader key={i} className={itemClassName} />
            ))}
        </div>
    );
};
