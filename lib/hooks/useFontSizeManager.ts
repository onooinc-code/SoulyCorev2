
"use client";

import { useCallback, useEffect } from 'react';
import { useLog } from '@/components/providers/LogProvider';

export const useFontSizeManager = () => {
    const { log } = useLog();

    // Persist font size changes
    useEffect(() => {
        const savedFontSize = localStorage.getItem('globalFontSize');
        if (savedFontSize) {
            document.documentElement.style.fontSize = savedFontSize;
        }
    }, []);

    const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
        log(`Changing font size: ${direction}`);
        const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        let newSize;
        if (direction === 'increase') {
            newSize = Math.min(currentSize * 1.1, 24); // Cap at 24px
        } else {
            newSize = Math.max(currentSize * 0.9, 12); // Floor at 12px
        }
        document.documentElement.style.fontSize = `${newSize}px`;
        localStorage.setItem('globalFontSize', `${newSize}px`);
    }, [log]);
    
    return {
        changeFontSize,
    };
};
