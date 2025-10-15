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
    // FIX: Updated action type to optionally accept a React MouseEvent.
    action?: (e?: React.MouseEvent) => void;
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
}

const SubMenu = ({ items, parentRect }: { items: MenuItem[]; parentRect: DOMRect | null }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (parentRect && menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const styles: React.CSSProperties = {};

            // Horizontal position
            if (parentRect.right + menuRect.width > window.innerWidth) {
                // Overflow right, so position to the left of the parent
                styles.left = parentRect.left - menuRect.width;
            } else {
                // Position to the right of the parent
                styles.left = parentRect.right;
            }

            // Vertical position
            if (parentRect.top + menuRect.height > window.innerHeight) {
                // Overflow bottom, so align bottom edges
                styles.top = parentRect.bottom - menuRect.height;
            } else {
                // Align top edges
                styles.top = parentRect.top;
            }

            // Ensure it doesn't go off-screen
            if (styles.left < 0) styles.left = 0;
            if (styles.top < 0) styles.top = 0;
            
            setPositionStyle(styles);
        }
    }, [parentRect]);
    
    return (
         <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.1 }}
            style={positionStyle}
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
                        // FIX: The previous implementation incorrectly prevented the event object from being passed to the action, causing an "Expected 1 arguments, but got 0" error in some cases. Directly assigning the action handler is safer and more conventional.
                        onClick={(e) => item.action && item.action(e)}
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
    
    const subMenuTimer = useRef<number | undefined>();

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
        
        if (isOpen) {
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
            window.clearTimeout(subMenuTimer.current);
        };
    }, [isOpen, onClose, position]);
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, item: MenuItem) => {
        window.clearTimeout(subMenuTimer.current);
        if (item.children) {
            // FIX: To prevent race conditions with React's synthetic event reuse, we get the DOMRect synchronously.
            // This captures the element's position at the time of the event and passes a plain object to the timer,
            // which is safer than accessing event properties in an async callback.
            const rect = e.currentTarget.getBoundingClientRect();
            subMenuTimer.current = window.setTimeout(() => {
                setActiveSubMenu(item.label);
                setActiveSubMenuRect(rect);
            }, 150);
        } else {
             subMenuTimer.current = window.setTimeout(() => {
                setActiveSubMenu(null);
             }, 300);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        window.clearTimeout(subMenuTimer.current);
        subMenuTimer.current = window.setTimeout(() => {
            setActiveSubMenu(null);
        }, 300);
    };

    const handleSubMenuEnter = (e: React.MouseEvent) => {
        window.clearTimeout(subMenuTimer.current);
    }
    
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ top: adjustedPosition.y, left: adjustedPosition.x } as React.CSSProperties}
                    className="fixed w-64 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-[100] p-1.5"
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={handleSubMenuEnter}
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
                                onClick={(e) => {
                                    if (item.children) {
                                        // On click/tap, toggle the submenu. This is for mobile/touch support.
                                        e.stopPropagation();
                                        setActiveSubMenu(prev => prev === item.label ? null : item.label);
                                        setActiveSubMenuRect(e.currentTarget.getBoundingClientRect());
                                    } else if (item.action) {
                                        // If it's a direct action, execute it and close the menu.
                                        // FIX: Pass the event object to the action handler for consistency and to fix "Expected 1 arguments, but got 0" errors.
                                        item.action(e);
                                        onClose();
                                    }
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
                
                <div onMouseEnter={handleSubMenuEnter} onMouseLeave={handleMouseLeave}>
                    <AnimatePresence>
                        {activeSubMenu && items.find(i => i.label === activeSubMenu)?.children && (
                            <SubMenu 
                                items={items.find(i => i.label === activeSubMenu)!.children!.map((child): MenuItem => {
                                    // FIX: The wrapper for submenu item actions was swallowing the event object, causing "Expected 1 arguments, but got 0" errors. The wrapper now accepts and passes the event.
                                    if (child.isSeparator) {
                                        return child;
                                    }
                                    return {
                                        label: child.label,
                                        // FIX: The wrapper function was swallowing the event object. It now accepts the event and passes it to the child action, and also calls onClose. This resolves the "Expected 1 arguments, but got 0" error.
                                        action: (e?: React.MouseEvent) => {
                                            if (child.action) {
                                                child.action(e);
                                            }
                                            onClose();
                                        },
                                        icon: child.icon,
                                        disabled: child.disabled,
                                        children: child.children,
                                    };
                                })} 
                                parentRect={activeSubMenuRect} 
                            />
                        )}
                    </AnimatePresence>
                </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ContextMenu;