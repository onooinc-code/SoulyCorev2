"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { RelationshipGraphData, GraphNode, GraphEdge } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';

const RelationshipGraph = () => {
    const [graphData, setGraphData] = useState<RelationshipGraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();

    // State for interactivity
    const [positions, setPositions] = useState<Map<string, { x: number, y: number }>>(new Map());
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 1000 });
    const [draggedNode, setDraggedNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);


    const fetchGraphData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/entities/relationships');
            if (!res.ok) throw new Error("Failed to fetch relationship data");
            const data = await res.json();
            setGraphData(data);

            // Set initial positions
            if (data?.nodes) {
                const initialPositions = new Map<string, { x: number, y: number }>();
                const count = data.nodes.length;
                const radius = Math.min(400, count * 25);
                const centerX = 500;
                const centerY = 500;

                data.nodes.forEach((node: GraphNode, i: number) => {
                    const angle = (i / count) * 2 * Math.PI;
                    initialPositions.set(node.id, {
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle),
                    });
                });
                setPositions(initialPositions);
            }

        } catch (error) {
            log('Error fetching relationship graph data', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    const getSVGPoint = (clientX: number, clientY: number) => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        return { x: svgP.x, y: svgP.y };
    };

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.target === svgRef.current) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const point = getSVGPoint(e.clientX, e.clientY);
        const nodePos = positions.get(nodeId);
        if (nodePos) {
            setDraggedNode({
                id: nodeId,
                offsetX: point.x - nodePos.x,
                offsetY: point.y - nodePos.y,
            });
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (draggedNode && positions.has(draggedNode.id)) {
            const point = getSVGPoint(e.clientX, e.clientY);
            const newPositions = new Map(positions);
            newPositions.set(draggedNode.id, {
                x: point.x - draggedNode.offsetX,
                y: point.y - draggedNode.offsetY,
            });
            setPositions(newPositions);
        } else if (isPanning && panStart) {
            const dx = (e.clientX - panStart.x) * (viewBox.width / (svgRef.current?.clientWidth || 1000));
            const dy = (e.clientY - panStart.y) * (viewBox.height / (svgRef.current?.clientHeight || 1000));
            setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setDraggedNode(null);
        setIsPanning(false);
        setPanStart(null);
    };

    const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        const scaleFactor = 1.1;
        const { x, y } = getSVGPoint(e.clientX, e.clientY);
        
        const newWidth = e.deltaY > 0 ? viewBox.width * scaleFactor : viewBox.width / scaleFactor;
        const newHeight = e.deltaY > 0 ? viewBox.height * scaleFactor : viewBox.height / scaleFactor;
        
        const dx = (x - viewBox.x) * (newWidth / viewBox.width - 1);
        const dy = (y - viewBox.y) * (newHeight / viewBox.height - 1);

        setViewBox({
            x: viewBox.x - dx,
            y: viewBox.y - dy,
            width: newWidth,
            height: newHeight,
        });
    };

    const formatDate = (date: Date | string | null | undefined): string => {
        if (!date) return '';
        return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    };

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
        <div className="w-full h-full overflow-hidden" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
            <svg
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
                className="min-w-full min-h-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <defs>
                    <marker
                        id="arrowhead"
                        viewBox="0 0 10 10"
                        refX="20"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a5568" />
                    </marker>
                </defs>
                
                {/* Edges */}
                {graphData.edges.map(edge => {
                    const sourcePos = positions.get(edge.source);
                    const targetPos = positions.get(edge.target);
                    if (!sourcePos || !targetPos) return null;

                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const midY = (sourcePos.y + targetPos.y) / 2;
                    const confidence = edge.confidenceScore ?? 0.5;

                    let dateLabel = '';
                    if (edge.startDate && edge.endDate) {
                        dateLabel = `(${formatDate(edge.startDate)} - ${formatDate(edge.endDate)})`;
                    } else if (edge.startDate) {
                        dateLabel = `(since ${formatDate(edge.startDate)})`;
                    } else if (edge.endDate) {
                        dateLabel = `(until ${formatDate(edge.endDate)})`;
                    }

                    return (
                        <g key={edge.id} className="pointer-events-none" opacity={0.3 + confidence * 0.7}>
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
                                {edge.label} ({Math.round(confidence * 100)}%)
                            </text>
                            {dateLabel && (
                                <text
                                    x={midX}
                                    y={midY + 5}
                                    fill="#718096"
                                    fontSize="8"
                                    textAnchor="middle"
                                >
                                    {dateLabel}
                                </text>
                            )}
                        </g>
                    );
                })}
                
                {/* Nodes */}
                {graphData.nodes.map(node => {
                    const pos = positions.get(node.id);
                    if (!pos) return null;

                    return (
                        <g 
                            key={node.id} 
                            transform={`translate(${pos.x}, ${pos.y})`}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                            style={{ cursor: draggedNode?.id === node.id ? 'grabbing' : 'grab' }}
                        >
                            <circle r="12" fill="#4f46e5" stroke="#818cf8" strokeWidth="2" />
                            <text
                                y="-20"
                                fill="#d1d5db"
                                fontSize="12"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="pointer-events-none select-none"
                            >
                                {node.name}
                            </text>
                            <text
                                y="25"
                                fill="#9ca3af"
                                fontSize="10"
                                textAnchor="middle"
                                className="font-mono pointer-events-none select-none"
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