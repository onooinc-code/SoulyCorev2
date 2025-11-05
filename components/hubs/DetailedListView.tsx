// components/hubs/DetailedListView.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const DetailedListView = () => {
    const [relationships, setRelationships] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/entities/relationships/detailed');
            if (!res.ok) throw new Error('Failed to load detailed view data');
            const data = await res.json();
            setRelationships(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div className="p-4"><SkeletonLoader className="h-8 w-full" /><SkeletonLoader className="h-8 w-full mt-2" /></div>;
    }

    if (error) {
        return <div className="p-4 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
                    <tr>
                        <th className="p-3">Source Entity</th>
                        <th className="p-3">Predicate</th>
                        <th className="p-3">Target Entity</th>
                        <th className="p-3">Brain</th>
                        <th className="p-3">Context</th>
                    </tr>
                </thead>
                <tbody>
                    {relationships.map(rel => (
                        <tr key={rel.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-3">{rel.sourceName} <span className="text-gray-500">({rel.sourceType})</span></td>
                            <td className="p-3 font-mono text-indigo-300">{rel.predicateName}</td>
                            <td className="p-3">{rel.targetName} <span className="text-gray-500">({rel.targetType})</span></td>
                            <td className="p-3">{rel.brainName || 'Default'}</td>
                            <td className="p-3 text-gray-400 text-xs truncate">{rel.context}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DetailedListView;
