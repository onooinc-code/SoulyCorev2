

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
      </head>
      <body className="bg-gray-800 text-gray-100 font-sans">{children}</body>
    </html>
  );
}