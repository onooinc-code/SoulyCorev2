"use client";
import React from 'react';

export const ScissorsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.843 16.277L3 21m0 0l4.723-4.723M3 21h3.375c.621 0 1.223-.24 1.664-.682L12 15.5m-9-9l4.723 4.723" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.157 7.723L21 3m0 0l-4.723 4.723M21 3h-3.375a2.25 2.25 0 00-1.664.682L12 8.5m9 9l-4.723-4.723" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5a4.5 4.5 0 016.364 0 4.5 4.5 0 010 6.364m-6.364-6.364a4.5 4.5 0 00-6.364 0 4.5 4.5 0 000 6.364m6.364-6.364L12 8.5" />
    </svg>
);