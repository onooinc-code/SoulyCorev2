"use client";

import React from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { DocumentTextIcon } from '@/components/Icons';

const DocumentExtractor = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            <EmptyState
                icon={DocumentTextIcon}
                title="Coming Soon"
                description="This feature will allow you to extract memory from uploaded documents like PDFs and text files."
            />
        </div>
    );
};

export default DocumentExtractor;
