// components/ui/SkeletonLoader.tsx
"use client";

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
                // FIX: Wrapped SkeletonLoader in a div with the key to resolve a TypeScript error. This pattern is consistent with other list-rendering fixes in the codebase where the key prop is incorrectly type-checked.
                <div key={i}>
                    <SkeletonLoader className={itemClassName} />
                </div>
            ))}
        </div>
    );
};