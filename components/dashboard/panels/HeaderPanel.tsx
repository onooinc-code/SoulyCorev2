"use client";

import React from 'react';

const HeaderPanel = () => {
    return (
        <div className="relative w-full h-32 md:h-48 rounded-lg overflow-hidden border border-indigo-500/30 p-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-900/50">
                <style>{`
                    @keyframes animated-grid {
                        0% { background-position: 0 0; }
                        100% { background-position: 100% 100%; }
                    }
                    .animated-grid-bg {
                        background-image:
                            linear-gradient(to right, rgba(79, 70, 229, 0.3) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(79, 70, 229, 0.3) 1px, transparent 1px);
                        background-size: 40px 40px;
                        animation: animated-grid 20s linear infinite;
                    }
                `}</style>
                <div className="absolute inset-0 animated-grid-bg"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-gray-900/80"></div>
            </div>
            <div className="relative z-10 text-center">
                 <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter">
                    <span className="text-indigo-400">SOULY</span>CORE
                </h2>
                <p className="text-sm md:text-base text-gray-300 mt-2">Project Intelligence & Management Center</p>
            </div>
        </div>
    );
};

export default HeaderPanel;
