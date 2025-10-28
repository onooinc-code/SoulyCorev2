"use client";

// components/ui/SkeletonLoader.tsx
import React from 'react';

// FIX: Extracted props to a dedicated interface to fix type error with `key` prop.
interface SkeletonLoaderProps {
    className?: string;
}

// FIX: Changed the SkeletonLoader component to be of type React.FC<SkeletonLoaderProps> to correctly type it as a React functional component. This resolves the TypeScript error where the 'key' prop, used in list rendering, was being incorrectly checked against the component's own props.
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = 'h-4 bg-gray-700 rounded w-3/4' }) => {
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