"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Corrected relative import path to use the `@` alias.
import { useUIState } from '@/components/providers/UIStateProvider';

const TopProgressBar = () => {
    const { isNavigating } = useUIState();

    return (
        <AnimatePresence>
            {isNavigating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="fixed top-0 left-0 right-0 h-0.5 z-[200]"
                >
                    <div className="relative w-full h-full bg-indigo-500/30 overflow-hidden">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                duration: 0.7,
                                ease: 'linear'
                            }}
                            className="absolute top-0 left-0 h-full w-1/4 bg-indigo-500"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TopProgressBar;