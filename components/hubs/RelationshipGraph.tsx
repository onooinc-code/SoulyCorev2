"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLog } from '@/components/providers/LogProvider';
import { RefreshIcon, CubeIcon } from '@/components/Icons';
import type { RelationshipGraphData, GraphNode, GraphEdge } from '@/lib/types';

// Component for a single node in the graph
const Node = ({ node, pos, onClick, isSelected, isFaded }: any) => (
    <motion.div
        initial={{ scale: 0 }}
        animate={{ x: pos.x, y: pos.y, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onClick}
        className={`absolute w-32 text-center p-2 rounded-lg cursor-pointer transition-opacity duration-300 ${isFaded ? 'opacity-20' : 'opacity-100'}`}
        style={{ transform: 'translate(-50%, -50%)' }}
    >
        <div className={`p-2 rounded-lg border-2 ${isSelected ? 'bg-indigo-600/50 border-indigo-400' : 'bg-gray-700/80 border-gray-600 hover:border-indigo-500'}`}>
            <CubeIcon className="w-6 h-6 mx-auto mb-1 text-indigo-300" />
            <p className="text-xs font-bold truncate">{node.name}</p>
            <p className="text-[10px] text-gray-400">{node.type}</p>
        </div>
    </motion.div>
);

// Component for a single edge (the line)
const Edge = ({ edge, sourcePos, targetPos, onHover, isFaded }: any) => {
    const pathData = `M ${sourcePos.x},${sourcePos.y} Q ${(sourcePos.x + targetPos.x) / 2},${(sourcePos.y + targetPos.y) / 2 - 30} ${targetPos.x},${targetPos.y}`;
    return (
        <g onMouseEnter={() => onHover(edge)} onMouseLeave={() => onHover(null)} className={`transition-opacity duration-300 ${isFaded ? 'opacity-10' : 'opacity-60'}`}>
            <path d={pathData} stroke="transparent" strokeWidth="15" fill="none" />
            <path d={pathData} stroke="#6366f1" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
            <text dy="-5" style={{ fontSize: '10px', fill: '#a5b4fc' }}>
                <textPath href={`#${edge.id}`} startOffset="50%" textAnchor="middle">{edge.label}</textPath>
            </text>
            <path id={edge.id} d={pathData} fill="none" />
        </g>
    );
};


const RelationshipGraph = () => {
    const { log } = useLog();
    const [graphData, setGraphData] = useState<RelationshipGraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number, y: number }>>({});
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/entities/relationships');
            if (!res.ok) throw new Error("Failed to fetch graph data");
            const data = await res.json();
            setGraphData(data);
            log(`Fetched ${data.nodes.length} nodes and ${data.edges.length} edges.`);
        } catch (error) {
            log('Error fetching relationship graph', { error }, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ width, height });
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (graphData && containerSize.width > 0) {
            const positions: Record<string, { x: number, y: number }> = {};
            const { width, height } = containerSize;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - 80; // -80 for padding
            const angleStep = (2 * Math.PI) / graphData.nodes.length;

            graphData.nodes.forEach((node, index) => {
                positions[node.id] = {
                    x: centerX + radius * Math.cos(angleStep * index - Math.PI / 2),
                    y: centerY + radius * Math.sin(angleStep * index - Math.PI / 2),
                };
            });
            setNodePositions(positions);
        }
    }, [graphData, containerSize]);

    const connectedNodeIds = useMemo(() => {
        if (!selectedNodeId || !graphData) return null;
        const connected = new Set([selectedNodeId]);
        graphData.edges.forEach(edge => {
            if (edge.source === selectedNodeId) connected.add(edge.target);
            if (edge.target === selectedNodeId) connected.add(edge.source);
        });
        return connected;
    }, [selectedNodeId, graphData]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><p>Loading relationship data...</p></div>;
    if (!graphData || graphData.nodes.length === 0) {
        return <div className="flex items-center justify-center h-full text-center p-8"><div><h3 className="text-lg">No Relationships Found</h3><p className="text-sm text-gray-400">The AI hasn't learned any relationships between entities yet.</p></div></div>;
    }

    return (
        <div className="relative w-full h-full" ref={containerRef}>
             <button onClick={fetchData} className="absolute top-2 right-2 z-20 p-2 bg-gray-700 rounded-full hover:bg-gray-600" title="Refresh Graph"><RefreshIcon className="w-5 h-5"/></button>

            <svg className="absolute inset-0 z-0">
                <defs>
                    <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
                    </marker>
                </defs>
                <g>
                    {graphData.edges.map(edge => {
                        const sourcePos = nodePositions[edge.source];
                        const targetPos = nodePositions[edge.target];
                        if (!sourcePos || !targetPos) return null;

                        const isFaded = selectedNodeId && (edge.source !== selectedNodeId && edge.target !== selectedNodeId);

                        return <Edge key={edge.id} edge={edge} sourcePos={sourcePos} targetPos={targetPos} onHover={setHoveredEdge} isFaded={isFaded} />;
                    })}
                </g>
            </svg>

            {graphData.nodes.map(node => {
                const pos = nodePositions[node.id];
                if (!pos) return null;
                const isFaded = connectedNodeIds && !connectedNodeIds.has(node.id);
                return <Node key={node.id} node={node} pos={pos} onClick={() => setSelectedNodeId(prev => prev === node.id ? null : node.id)} isSelected={selectedNodeId === node.id} isFaded={isFaded} />;
            })}
            
             <AnimatePresence>
                {hoveredEdge && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 left-4 z-20 p-3 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-lg max-w-sm text-sm"
                    >
                        <p className="font-bold text-indigo-300 capitalize">{hoveredEdge.label}</p>
                        {hoveredEdge.context && <p className="text-xs text-gray-300 mt-1 italic">Context: "{hoveredEdge.context}"</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RelationshipGraph;