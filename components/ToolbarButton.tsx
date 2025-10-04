
import React from 'react';

interface ToolbarButtonProps {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    title: string;
    children?: React.ReactNode;
    color: string;
    disabled?: boolean;
}

// Map color names to Tailwind CSS classes for a consistent theme
const colorClasses: Record<string, string> = {
    purple: 'bg-purple-600 hover:bg-purple-500',
    blue: 'bg-blue-600 hover:bg-blue-500',
    red: 'bg-red-600 hover:bg-red-500',
    gray: 'bg-gray-600 hover:bg-gray-500',
    yellow: 'bg-yellow-500 hover:bg-yellow-400',
    cyan: 'bg-cyan-500 hover:bg-cyan-400',
    lime: 'bg-lime-500 hover:bg-lime-400',
};

const ToolbarButton = ({ onClick, title, children, color, disabled }: ToolbarButtonProps) => {
    const bgColor = colorClasses[color] || colorClasses.gray;

    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`
                relative flex items-center justify-center 
                w-10 h-10 rounded-full 
                text-white 
                shadow-md
                transition-all duration-300 ease-in-out 
                transform-gpu 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white/50
                hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/30
                disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none
                ${bgColor}
            `}
        >
            {/* Subtle inner shine effect for depth and style */}
            <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent rounded-full"></span>
            <div className="relative z-10">
                {children}
            </div>
        </button>
    );
};

export default ToolbarButton;