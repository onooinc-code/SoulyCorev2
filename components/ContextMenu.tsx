"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the type for a menu item, which can also be a separator or a group with children.
export interface MenuItem {
    label?: string;
    icon?: React.FC<React.SVGProps<SVGSVGElement>>;
    action?: () => void;
    disabled?: boolean;
    isSeparator?: boolean;
    children?: MenuItem[];
}

interface ContextMenuProps {
    isOpen: boolean;
    position: { x: number; y: number };
    items: MenuItem[];
    onClose: () => void;
}

const ContextMenu = ({ isOpen, position, items, onClose }: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

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
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const renderMenuItems = (menuItems: MenuItem[]) => {
        return menuItems.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
                {group.isSeparator && <div className="h-px bg-gray-700 my-1" />}
                {group.label && <div className="px-3 py-1.5 text-xs font-semibold text-gray-500">{group.label}</div>}
                {group.children && group.children.map((item, itemIndex) => {
                    if (item.isSeparator) {
                        return <div key={`${groupIndex}-${itemIndex}`} className="h-px bg-gray-700 my-1 mx-3" />;
                    }
                    const { label, icon: Icon, action, disabled } = item;
                    return (
                        <button
                            key={`${groupIndex}-${itemIndex}`}
                            disabled={disabled}
                            onClick={() => {
                                if (action) action();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 text-left px-3 py-1.5 text-sm text-gray-200 rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                            {Icon && <Icon className="w-4 h-4" />}
                            <span>{label}</span>
                        </button>
                    );
                })}
            </React.Fragment>
        ));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    className="fixed w-64 bg-gray-800/80 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-2 z-[100]"
                    style={{ top: position.y, left: position.x }}
                >
                    {renderMenuItems(items)}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContextMenu;
