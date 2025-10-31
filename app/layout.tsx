import './globals.css';
import React from 'react';

// FIX: A root layout in Next.js App Router MUST return <html> and <body> tags.
// The previous implementation was missing them, causing critical hydration errors and a blank page.
// This has been corrected to provide the proper document structure.
// The 'use client' directive and useEffect hook were removed as they are no longer needed.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* The body class was previously applied via a useEffect hook. 
          Applying it directly is the correct pattern in Next.js. */}
      <body className="bg-gray-800 text-gray-100 font-sans">
        {children}
      </body>
    </html>
  );
}
