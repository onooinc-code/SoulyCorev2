// FIX: Removed the explicit Metadata type import and annotation to resolve a potential
// toolchain/TypeScript error. Next.js can infer the metadata object's type correctly without it.
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SoulyCore - Final',
  description: "The definitive, full-stack version of SoulyCore with a cloud-native, autonomous memory system.",
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1f2937" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-800 text-gray-100 font-sans">{children}</body>
    </html>
  );
}