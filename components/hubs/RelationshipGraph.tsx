"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RelationshipGraphData, GraphNode, GraphEdge } from '@/lib/types';
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

    const nodePositions = useMemo(() => {
        if (!graphData?.nodes) return new Map();
        const positions = new Map<string, { x: number, y: number }>();
        const count = graphData.nodes.length;
        const radius = Math.min(400, count * 20); 
        const centerX = 500;
        const centerY = 500;

        graphData.nodes.forEach((node, i) => {
            const angle = (i / count) * 2 * Math.PI;
            positions.set(node.id, {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
            });
        });
        return positions;
    }, [graphData]);


    if (isLoading) {
        return <div className="p-4 text-center">Loading relationship data...</div>;
    }

    if (!graphData || graphData.nodes.length === 0) {
        return (
            <div className="p-4 h-full flex items-center justify-center text-gray-500">
                No entities or relationships to display.
            </div>
        );
    }
    
    return (
        <div className="w-full h-full overflow-auto">
            <svg viewBox="0 0 1000 1000" className="min-w-full min-h-full">
                <defs>
                    <marker
                        id="arrowhead"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a5568" />
                    </marker>
                </defs>
                
                {/* Edges */}
                {graphData.edges.map(edge => {
                    const sourcePos = nodePositions.get(edge.source);
                    const targetPos = nodePositions.get(edge.target);
                    if (!sourcePos || !targetPos) return null;

                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const midY = (sourcePos.y + targetPos.y) / 2;

                    return (
                        <g key={edge.id}>
                            <line
                                x1={sourcePos.x}
                                y1={sourcePos.y}
                                x2={targetPos.x}
                                y2={targetPos.y}
                                stroke="#4a5568"
                                strokeWidth="1"
                                markerEnd="url(#arrowhead)"
                            />
                            <text
                                x={midX}
                                y={midY - 5}
                                fill="#a0aec0"
                                fontSize="10"
                                textAnchor="middle"
                                className="font-mono"
                            >
                                {edge.label}
                            </text>
                        </g>
                    );
                })}
                
                {/* Nodes */}
                {graphData.nodes.map(node => {
                    const pos = nodePositions.get(node.id);
                    if (!pos) return null;

                    return (
                        <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                            <circle r="12" fill="#4f46e5" />
                            <text
                                y="-20"
                                fill="#d1d5db"
                                fontSize="12"
                                fontWeight="bold"
                                textAnchor="middle"
                            >
                                {node.name}
                            </text>
                            <text
                                y="25"
                                fill="#9ca3af"
                                fontSize="10"
                                textAnchor="middle"
                                className="font-mono"
                            >
                                ({node.type})
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default RelationshipGraph;