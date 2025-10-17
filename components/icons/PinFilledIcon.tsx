
"use client";
import React from 'react';

// A filled version of the pin icon for the active/pinned state.
export const PinFilledIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M19.5 21a3 3 0 003-3V9A3 3 0 0019.5 6h-4.5V4.5a3 3 0 00-3-3h-3a3 3 0 00-3 3V6H4.5A3 3 0 001.5 9v9a3 3 0 003 3h15zm-6.22-8.03a.75.75 0 00-1.06 0l-1.5 1.5a.75.75 0 001.06 1.06l1.5-1.5a.75.75 0 000-1.06z" clipRule="evenodd" />
        <path d="M12.75 6v.008H12.75V6zM11.25 6v.008H11.25V6zM9.75 6v.008H9.75V6zM8.25 6v.008H8.25V6zM12.75 9v.008H12.75V9zM11.25 9v.008H11.25V9zM9.75 9v.008H9.75V9zM8.25 9v.008H8.25V9zM12.75 12v.008H12.75V12zM11.25 12v.008H11.25V12zM9.75 12v.008H9.75V12zM8.25 12v.008H8.25V12z" />
    </svg>
);
