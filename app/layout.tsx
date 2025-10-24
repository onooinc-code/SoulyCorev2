

import './globals.css';
import React, { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // FIX: The component was returning `children` directly, which is of type `React.ReactNode`.
  // A component's return type should be a `React.ReactElement` or `null`. Wrapping `children` in a fragment
  // (`<>...</>`) ensures a valid return type and resolves the TypeScript type inference issue causing the error in `index.tsx`.
  return <>{children}</>;
}