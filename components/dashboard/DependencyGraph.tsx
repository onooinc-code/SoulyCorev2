"use client";

import React, { useState } from 'react';
import type { Subsystem } from '@/lib/types';

interface DependencyGraphProps {
    subsystems: Subsystem[];
}

const healthColorMap = {
    'A+': 'bg-green-400', 'A': 'bg-green-500', 'B': 'bg-yellow-400',
    'C': 'bg-orange-400', 'D': 'bg-red-500', 'F': 'bg-red-600'
};

const DependencyGraph = ({ subsystems }: DependencyGraphProps) => {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    const positions = {
        soulycore: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        'hedra-ui': { top: '10%', left: '10%' },
        hedrasoul: { top: '80%', left: '80%', transform: 'translate(-100%, -100%)' },
        // Add more positions for future subsystems
    };

    return (
        <div className="relative w-full h-64 md:h-80" onMouseLeave={() => setHoveredNode(null)}>
            <svg className="absolute inset-0 w-full h-full">
                {subsystems.map(sub => 
                    sub.dependencies.map(depId => {
                         const isHighlighted = hoveredNode === sub.id || hoveredNode === depId;
                         const depPos = positions[depId as keyof typeof positions] || { top: '50%', left: '50%' };
                         const subPos = positions[sub.id as keyof typeof positions] || { top: '50%', left: '50%' };
                        return (
                             <line
                                key={`${sub.id}-${depId}`}
                                x1={depPos.left}
                                y1={depPos.top}
                                x2={subPos.left}
                                y2={subPos.top}
                                className={`stroke-current transition-all duration-300 ${isHighlighted ? 'text-indigo-400' : 'text-gray-600'}`}
                                strokeWidth={isHighlighted ? 3 : 1.5}
                                markerEnd="url(#arrow)"
                            />
                        )
                    })
                )}
                 <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current text-gray-600" />
                    </marker>
                </defs>
            </svg>

            {subsystems.map(sub => (
                 <div
                    key={sub.id}
                    id={`node-${sub.id}`}
                    className="absolute p-2 rounded-lg bg-gray-900 border-2 border-gray-700 hover:border-indigo-500 transition-all duration-300"
                    style={positions[sub.id as keyof typeof positions]}
                    onMouseEnter={() => setHoveredNode(sub.id)}
                 >
                    <div className="flex items-center gap-2">
                         <span className={`w-3 h-3 rounded-full ${healthColorMap[sub.healthScore]}`}></span>
                         <span className="text-xs font-bold">{sub.name}</span>
                    </div>
                 </div>
            ))}
        </div>
    );
};

export default DependencyGraph;
