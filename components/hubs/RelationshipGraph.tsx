"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { RelationshipGraphData, GraphNode, GraphEdge, Brain } from '@/lib/types';
import { useLog } from '@/components/providers/LogProvider';
import { SearchIcon, XIcon, TrashIcon } from '@/components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const RelationshipGraph = () => {
    const [fullGraphData, setFullGraphData] = useState<RelationshipGraphData | null>(null);
    const [displayGraphData, setDisplayGraphData] = useState<RelationshipGraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { log } = useLog();
    const [brains, setBrains] = useState<Brain[]>([]);
    const [activeBrainId, setActiveBrainId] = useState<string>('none');

    // State for interactivity
    const [positions, setPositions] = useState<Map<string, { x: number, y: number }>>(new Map());
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1000, height: 1000 });
    const [draggedNode, setDraggedNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const [hoveredEdge, setHoveredEdge] = useState<{ edge: GraphEdge; pos: { x: number; y: number } } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // State for new features
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; edgeId: string | null }>({ visible: false, x: 0, y: 0, edgeId: null });
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

    // State for semantic search
    const [semanticQuery, setSemanticQuery] = useState('');
    const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(new Set());


    useEffect(() => {
        const fetchBrains = async () => {
            try {
                const res = await fetch('/api/brains');
                if (res.ok) {
                    const data = await res.json();
                    setBrains(data);
                }
            } catch (error) {
                log('Failed to fetch brains for graph', { error }, 'error');
            }
        };
        fetchBrains();
    }, [log]);


    const fetchGraphData = useCallback(async (brainId: string) => {
        if (!isAutoRefreshEnabled && !isLoading) { // Don't set loading on background refresh
            setIsLoading(true);
        }
        try {
            const res = await fetch(`/api/entities/relationships?brainId=${brainId}`);
            if (!res.ok) throw new Error("Failed to fetch relationship data");
            const data = await res.json();
            setFullGraphData(data);
            setDisplayGraphData(data);

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
    }, [log, isAutoRefreshEnabled, isLoading]);

    useEffect(() => {
        fetchGraphData(activeBrainId);
    }, [fetchGraphData, activeBrainId]);
    
    useEffect(() => {
        if (isAutoRefreshEnabled) {
            const intervalId = setInterval(() => {
                fetchGraphData(activeBrainId);
            }, 15000); // every 15 seconds

            return () => clearInterval(intervalId);
        }
    }, [isAutoRefreshEnabled, fetchGraphData, activeBrainId]);

    // --- Interactivity Handlers ---

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
        setContextMenu({ visible: false, x: 0, y: 0, edgeId: null });
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
    
    const handleEdgeContextMenu = (e: React.MouseEvent, edgeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, edgeId });
    };

    // --- New Feature Handlers ---

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setDisplayGraphData(fullGraphData);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch('/api/entities/relationships/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery }),
            });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setDisplayGraphData(data);
        } catch (error) {
            log('Natural language query failed', { error }, 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleResetSearch = () => {
        setSearchQuery('');
        setDisplayGraphData(fullGraphData);
    };

    const handleSemanticSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!semanticQuery.trim()) return;

        try {
            const res = await fetch('/api/entities/relationships/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: semanticQuery }),
            });
            if (!res.ok) throw new Error('Semantic search failed');
            const data = await res.json();
            setHighlightedEdgeIds(new Set(data.map((r: any) => r.id)));
        } catch (error) {
             log('Semantic search failed', { error }, 'error');
        }
    };

    const handleResetSemanticSearch = () => {
        setSemanticQuery('');
        setHighlightedEdgeIds(new Set());
    };

    const handleDeleteEdge = async () => {
        if (!contextMenu.edgeId) return;
        try {
            const res = await fetch(`/api/entities/relationships/${contextMenu.edgeId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete relationship');
            setContextMenu({ visible: false, x: 0, y: 0, edgeId: null });
            await fetchGraphData(activeBrainId); // Refresh data
        } catch (error) {
            log('Error deleting relationship', { error }, 'error');
        }
    };
    
    const handleUpdateNodeName = async (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>, nodeId: string) => {
        const newName = e.currentTarget.value;
        setEditingNodeId(null);

        const originalNode = fullGraphData?.nodes.find(n => n.id === nodeId);
        if (!originalNode || originalNode.name === newName) return;

        try {
            const res = await fetch(`/api/entities/${nodeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...originalNode, name: newName }),
            });
            if (!res.ok) throw new Error('Failed to update entity name');
            await fetchGraphData(activeBrainId);
        } catch (error) {
            log('Error updating entity name', { error }, 'error');
        }
    };

    const highlightedNodeIds = useMemo(() => {
        if (highlightedEdgeIds.size === 0 || !displayGraphData) return new Set<string>();
        const ids = new Set<string>();
        displayGraphData.edges.forEach(edge => {
            if (highlightedEdgeIds.has(edge.id)) {
                ids.add(edge.source);
                ids.add(edge.target);
            }
        });
        return ids;
    }, [highlightedEdgeIds, displayGraphData]);

    if (isLoading) {
        return <div className="p-4 text-center">Loading relationship data...</div>;
    }

    if (!displayGraphData || displayGraphData.nodes.length === 0) {
        return (
            <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
                No entities or relationships to display for this query or brain.
                 <button onClick={handleResetSearch} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm">Reset View</button>
            </div>
        );
    }
    
    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
             {contextMenu.visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="absolute z-10 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-1"
                >
                    <button onClick={handleDeleteEdge} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 rounded">
                        <TrashIcon className="w-4 h-4" /> Delete Relationship
                    </button>
                </motion.div>
            )}
             <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-center gap-2">
                 <button 
                    onClick={() => setIsAutoRefreshEnabled(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-full text-xs font-semibold"
                    title={isAutoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                >
                    <span className={`w-2 h-2 rounded-full ${isAutoRefreshEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
                    LIVE
                </button>
                <select value={activeBrainId} onChange={e => setActiveBrainId(e.target.value)} className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-full px-4 py-2 text-sm">
                    <option value="none">Default (No Brain)</option>
                    {brains.map(brain => <option key={brain.id} value={brain.id}>{brain.name}</option>)}
                    <option value="all">All Brains</option>
                </select>
                <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Natural language query..."
                        className="w-full pl-4 pr-16 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button type="button" onClick={handleResetSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white">Reset</button>
                </form>
                 <form onSubmit={handleSemanticSearch} className="relative flex-1 max-w-sm">
                    <input
                        type="text"
                        value={semanticQuery}
                        onChange={(e) => setSemanticQuery(e.target.value)}
                        placeholder="Semantic relationship search..."
                        className="w-full pl-4 pr-16 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button type="button" onClick={handleResetSemanticSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white">Reset</button>
                </form>
            </div>
            <div className="w-full h-full" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
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
                    
                    {displayGraphData.edges.map(edge => {
                        const sourcePos = positions.get(edge.source);
                        const targetPos = positions.get(edge.target);
                        if (!sourcePos || !targetPos) return null;

                        const midX = (sourcePos.x + targetPos.x) / 2;
                        const midY = (sourcePos.y + targetPos.y) / 2;
                        const confidence = edge.confidenceScore ?? 0.5;
                        
                        const isHighlighted = highlightedEdgeIds.has(edge.id);
                        const hasHighlights = highlightedEdgeIds.size > 0;
                        const opacity = hasHighlights ? (isHighlighted ? 1.0 : 0.1) : (0.3 + confidence * 0.7);


                        return (
                            <g 
                                key={edge.id}
                                opacity={opacity}
                                onMouseEnter={() => { if (edge.metadata && Object.keys(edge.metadata).length > 0) { setHoveredEdge({ edge, pos: { x: midX + 10, y: midY + 10 } }); } }}
                                onMouseLeave={() => setHoveredEdge(null)}
                                onContextMenu={(e) => handleEdgeContextMenu(e, edge.id)}
                            >
                                <line x1={sourcePos.x} y1={sourcePos.y} x2={targetPos.x} y2={targetPos.y} stroke="#4a5568" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                                <text x={midX} y={midY - 5} fill="#a0aec0" fontSize="10" textAnchor="middle" className="font-mono pointer-events-none">{edge.label}</text>
                            </g>
                        );
                    })}
                    
                    {displayGraphData.nodes.map(node => {
                        const pos = positions.get(node.id);
                        if (!pos) return null;

                        const hasHighlights = highlightedEdgeIds.size > 0;
                        const isNodeHighlighted = highlightedNodeIds.has(node.id);
                        const opacity = hasHighlights ? (isNodeHighlighted ? 1.0 : 0.2) : 1.0;

                        return (
                            <g 
                                key={node.id} 
                                transform={`translate(${pos.x}, ${pos.y})`}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onDoubleClick={() => setEditingNodeId(node.id)}
                                style={{ cursor: draggedNode?.id === node.id ? 'grabbing' : 'grab' }}
                                opacity={opacity}
                            >
                                <circle r="12" fill="#4f46e5" stroke="#818cf8" strokeWidth="2" />
                                {editingNodeId === node.id ? (
                                    <foreignObject x="-50" y="-12" width="100" height="24">
                                        <input
                                            type="text"
                                            defaultValue={node.name}
                                            onBlur={(e) => handleUpdateNodeName(e, node.id)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateNodeName(e, node.id); }}
                                            className="w-full text-center bg-gray-900 border border-indigo-500 rounded text-xs p-1"
                                            autoFocus
                                        />
                                    </foreignObject>
                                ) : (
                                     <text y="-20" fill="#d1d5db" fontSize="12" fontWeight="bold" textAnchor="middle" className="pointer-events-none select-none">{node.name}</text>
                                )}
                                <text y="25" fill="#9ca3af" fontSize="10" textAnchor="middle" className="font-mono pointer-events-none select-none">({node.type})</text>
                            </g>
                        );
                    })}

                    {hoveredEdge && (
                        <foreignObject x={hoveredEdge.pos.x} y={hoveredEdge.pos.y} width="200" height="150" className="pointer-events-none">
                            <div className="bg-gray-900/80 p-2 rounded text-xs border border-gray-600 shadow-lg"><h4 className="font-bold text-gray-200 mb-1">Additional Data</h4><pre className="whitespace-pre-wrap text-gray-300"><code>{JSON.stringify(hoveredEdge.edge.metadata, null, 2)}</code></pre></div>
                        </foreignObject>
                    )}
                </svg>
            </div>
        </div>
    );
};

export default RelationshipGraph;