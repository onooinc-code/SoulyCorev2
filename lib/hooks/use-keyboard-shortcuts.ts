
"use client";

import { useEffect, useCallback } from 'react';

type ShortcutMap = {
    [key: string]: () => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Use a more robust way to create the key string
        const key = event.key.toLowerCase();
        const meta = event.metaKey || event.ctrlKey; // 'mod' for both Cmd and Ctrl
        
        // Simple key check (e.g., 'enter', 'escape')
        if (shortcuts[key] && !meta) {
             event.preventDefault();
             shortcuts[key]();
             return;
        }

        // Check for modifier + key combinations
        if (meta) {
            const combination = `mod+${key}`;
            if (shortcuts[combination]) {
                event.preventDefault();
                shortcuts[combination]();
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
}
