"use client";

import './globals.css';
import React, { useEffect } from 'react';

// FIX: Refactored to use React.FC which provides better type inference for components with children,
// resolving the TypeScript error in index.tsx where the 'children' prop was not being correctly inferred.
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // These effects replicate the static parts of the original layout for a CSR app.
    document.documentElement.lang = 'en';
    document.body.className = "bg-gray-800 text-gray-100 font-sans";
    
    // Ensure theme-color meta tag exists
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = '#1f2937';
        document.head.appendChild(meta);
    } else {
        (themeMeta as HTMLMetaElement).content = '#1f2937';
    }

    // Clean up on unmount
    return () => {
      document.body.className = '';
    }
  }, []);

  return <>{children}</>;
};

export default RootLayout;
