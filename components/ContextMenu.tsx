
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SVGProps } from 'react';

// Define a generic IconType
export type IconType = React.FC<SVGProps<SVGSVGElement>>;

export type MenuItem = {
    isSeparator: true;
    label?: never; action?: never; icon?: never; disabled?: never; children?: never;
} | {
    label: string;
    action?: () => void;
    icon?: IconType;
    disabled?: boolean;
    isSeparator?: false | undefined;
    children?: MenuItem[];
};

interface ContextMenuProps {
    items: MenuItem[];
    position: { x: number; y: number };
    isOpen: boolean;
    onClose: () => void;
    quickActions?: MenuItem[];
}

const SubMenu = ({ items, parentRect }: { items: MenuItem[]; parentRect: DOMRect | null }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (parentRect && menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            let x = parentRect.right;
            let y = parentRect.top;

            if (x + menuRect.width > window.innerWidth) {
                x = parentRect.left - menuRect.width;
            }
            if (y + menuRect.height > window.innerHeight) {
                y = window.innerHeight - menuRect.height;
            }
            setPosition({ x, y });
        }
    }, [parentRect]);
    
    return (
         <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.1 }}
            style={{ top: position.y, left: position.x }}
            className="fixed w-60 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-[101] p-1.5"
        >
            {items.map((item, index) => {
                if (item.isSeparator) {
                    return <div key={`sub-sep-${index}`} className="h-px bg-gray-700 my-1.5" />;
                }
                const Icon = item.icon;
                return (
                     <button
                        key={item.label}
                        disabled={item.disabled}
                        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </motion.div>
    )
}


const ContextMenu = ({ items, position, isOpen, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
    const [activeSubMenuRect, setActiveSubMenuRect] = useState<DOMRect | null>(null);
    
    const subMenuTimer = useRef<number>();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        
        if (isOpen && menuRef.current) {
            // Defer adjustment until menu is rendered to get correct dimensions
            requestAnimationFrame(() => {
                if (!menuRef.current) return;
                const menuRect = menuRef.current.getBoundingClientRect();
                const newPos = { x: position.x, y: position.y };
    
                if (position.x + menuRect.width > window.innerWidth) {
                    newPos.x = window.innerWidth - menuRect.width - 10;
                }
                if (position.y + menuRect.height > window.innerHeight) {
                    newPos.y = window.innerHeight - menuRect.height - 10;
                }
                setAdjustedPosition(newPos);
            });
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('keydown', handleKeyDown, true);
        } else {
            setActiveSubMenu(null);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isOpen, onClose, position]);
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, item: MenuItem) => {
        clearTimeout(subMenuTimer.current);
        if (item.children) {
            subMenuTimer.current = window.setTimeout(() => {
                setActiveSubMenu(item.label);
                setActiveSubMenuRect(e.currentTarget.getBoundingClientRect());
            }, 100);
        } else {
             subMenuTimer.current = window.setTimeout(() => {
                setActiveSubMenu(null);
             }, 200);
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
                    className="fixed w-64 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-[100] p-1.5"
                    onMouseLeave={() => {
                        clearTimeout(subMenuTimer.current);
                        subMenuTimer.current = window.setTimeout(() => setActiveSubMenu(null), 300);
                    }}
                >
                    {items.map((item, index) => {
                        if (item.isSeparator) {
                            return <div key={`sep-${index}`} className="h-px bg-gray-700 my-1.5" />;
                        }

                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                onMouseEnter={(e) => handleMouseEnter(e, item)}
                                onClick={() => {
                                    if (item.action) item.action();
                                    onClose();
                                }}
                                disabled={item.disabled}
                                className="w-full flex items-center justify-between text-left px-3 py-2 text-sm text-gray-200 rounded-md hover:bg-indigo-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    {Icon && <Icon className="w-4 h-4" />}
                                    <span>{item.label}</span>
                                </div>
                                {item.children && <span className="text-xs">▶</span>}
                            </button>
                        );
                    })}
                </motion.div>
                
                <AnimatePresence>
                    {activeSubMenu && items.find(i => i.label === activeSubMenu)?.children && (
                        <SubMenu items={items.find(i => i.label === activeSubMenu)!.children!} parentRect={activeSubMenuRect} />
                    )}
                </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
};

export default ContextMenu;