
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from './providers/AppProvider';

const UniversalProgressIndicator = () => {
    const { backgroundTaskCount } = useAppContext();
    const isActive = backgroundTaskCount > 0;

    return (
        <AnimatePresence>
            {isActive && (
// FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components.
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed top-0 left-0 right-0 h-0.5 z-[200]"
                >
                    <div className="relative w-full h-full bg-indigo-500/20 overflow-hidden">
{/* FIX: The framer-motion library's type inference for motion components can fail when they are used within components typed with `React.FC`. Removing the explicit `React.FC` type annotation from functional components that use `motion` elements resolves these TypeScript errors. Although this specific component did not use `React.FC`, the error likely cascaded from a child component. The fix has been applied to all relevant child components. */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                            className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UniversalProgressIndicator;
