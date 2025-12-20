
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CopyIcon, ClipboardPasteIcon, TrashIcon
} from './Icons';

export interface MenuItem {
    label?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
    action?: () => void;
    disabled?: boolean;
    isSeparator?: boolean;
    children?: MenuItem[];
    shortcut?: string;
    danger?: boolean;
}

interface ContextMenuProps {
    position: { x: number; y: number };
    items: MenuItem[];
    onClose: () => void;
}

const SubMenu = ({ items, parentId }: { items: MenuItem[], parentId: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-full top-0 ml-1 w-48 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-1 z-[150] overflow-hidden"
        >
            {items.map((item, idx) => (
                 <button
                    key={`${parentId}-${idx}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (item.action) item.action();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-indigo-600 rounded flex items-center gap-2"
                >
                    {item.icon && <item.icon className="w-3 h-3" />}
                    {item.label}
                </button>
            ))}
        </motion.div>
    );
};

const ContextMenu = ({ position, items, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // --- Quick Action Handlers ---
    const handleCopy = async () => {
        try {
            const selection = window.getSelection()?.toString();
            if (selection) await navigator.clipboard.writeText(selection);
            onClose();
        } catch (e) { console.error(e); }
    };
    
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            // Dispatch a paste event or handle via active element
             const activeElement = document.activeElement;
            if (activeElement && (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)) {
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const value = activeElement.value;
                activeElement.value = value.substring(0, start) + text + value.substring(end);
                // Trigger change event for React state
                 const event = new Event('input', { bubbles: true });
                 activeElement.dispatchEvent(event);
            }
            onClose();
        } catch (e) { console.error(e); }
    };


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    // Adjust position to stay in viewport
    const adjustedX = Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 1000) - 260);
    const adjustedY = Math.min(position.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - items.length * 40);


    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-[140] flex flex-col gap-1"
            style={{ top: adjustedY, left: adjustedX }}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {/* Quick Actions Bar */}
            <div className="flex justify-between items-center gap-1 p-1 mb-1 border-b border-white/10 pb-2">
                <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors" title="Copy Selection"><CopyIcon className="w-4 h-4" /></button>
                <button onClick={handlePaste} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors" title="Paste"><ClipboardPasteIcon className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-white/10"></div>
                <button className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-red-400 transition-colors" title="Clear/Delete"><TrashIcon className="w-4 h-4" /></button>
            </div>

            {items.map((item, index) => {
                if (item.isSeparator) {
                    return <div key={index} className="h-px bg-white/10 my-1 mx-2" />;
                }
                
                const hasChildren = item.children && item.children.length > 0;

                return (
                    <div 
                        key={index} 
                        className="relative"
                        onMouseEnter={() => setHoveredIndex(index)}
                    >
                        <button
                            disabled={item.disabled}
                            onClick={() => {
                                if (item.action) {
                                    item.action();
                                    onClose();
                                }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors group ${
                                item.disabled 
                                ? 'opacity-50 cursor-not-allowed text-gray-500' 
                                : item.danger 
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-gray-200 hover:bg-indigo-600'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon && <item.icon className={`w-4 h-4 ${item.danger ? 'text-red-400' : 'text-gray-400 group-hover:text-white'}`} />}
                                <span>{item.label}</span>
                            </div>
                            {hasChildren && <span className="text-xs opacity-50">▶</span>}
                            {item.shortcut && <span className="text-[10px] opacity-40 font-mono">{item.shortcut}</span>}
                        </button>

                        {/* Nested Menu */}
                        <AnimatePresence>
                            {hasChildren && hoveredIndex === index && (
                                <SubMenu items={item.children!} parentId={`sub-${index}`} />
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </motion.div>
    );
};

export default ContextMenu;
