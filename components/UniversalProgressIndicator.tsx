
"use client";

import React from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

const UniversalProgressIndicator = () => {
    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 h-0.5 z-[200]"
        >
            <div className="relative w-full h-full bg-indigo-500/20 overflow-hidden">
                <MotionDiv
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
        </MotionDiv>
    );
};

export default UniversalProgressIndicator;
