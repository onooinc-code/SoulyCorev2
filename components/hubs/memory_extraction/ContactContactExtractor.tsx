"use client";

import React from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { UsersIcon } from '@/components/Icons';

const ContactContactExtractor = () => {
    return (
         <div className="w-full h-full flex items-center justify-center p-8">
            <EmptyState
                icon={UsersIcon}
                title="Coming Soon"
                description="This feature will allow you to extract memory from conversations between two contacts."
            />
        </div>
    );
};

export default ContactContactExtractor;