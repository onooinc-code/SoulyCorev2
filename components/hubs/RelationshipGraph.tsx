// components/hubs/RelationshipGraph.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { RelationshipGraphData } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

const RelationshipGraph = () => {
    const [graphData, setGraphData] = useState<RelationshipGraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    const fetchGraphData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/entities/relationships');
            if (!res.ok) throw new Error("Failed to fetch relationship data");
            const data = await res.json();
            setGraphData(data);
        } catch (error) {
            log('Error fetching relationship graph data', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    if (isLoading) {
        return <div className="p-4 text-center">Loading relationship data...</div>;
    }

    if (!graphData || graphData.nodes.length === 0) {
        return <div className="p-4 text-center">No relationships to display.</div>;
    }

    return (
        <div className="p-4">
            <h3 className="font-bold text-lg mb-4">Entity Relationship Graph (Placeholder)</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <p>Nodes: {graphData.nodes.length}</p>
                <p>Edges: {graphData.edges.length}</p>
                <pre className="text-xs mt-4 max-h-96 overflow-auto">
                    {JSON.stringify(graphData, null, 2)}
                </pre>
            </div>
             <p className="text-xs text-gray-500 mt-4 text-center">
                A visual graph component (e.g., using D3 or react-flow) would be implemented here to render this data.
            </p>
        </div>
    );
};

export default RelationshipGraph;
