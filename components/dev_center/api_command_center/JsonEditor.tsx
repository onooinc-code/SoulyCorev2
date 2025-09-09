"use client";

import React, { useState, useEffect } from 'react';

interface JsonEditorProps {
    value: string;
    onChange?: (newValue: string) => void;
    readOnly?: boolean;
}

const JsonEditor = ({ value, onChange, readOnly = false }: JsonEditorProps) => {
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        try {
            if (value.trim() !== '') {
                JSON.parse(value);
            }
            setIsValid(true);
        } catch (e) {
            setIsValid(false);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e.target.value);
        }
    };

    return (
        <div className="relative h-full">
            <textarea
                value={value}
                onChange={handleChange}
                readOnly={readOnly}
                className={`w-full h-full p-3 bg-gray-900 rounded-md font-mono text-sm resize-none focus:outline-none ${readOnly ? 'text-gray-400' : 'text-white focus:ring-2 focus:ring-indigo-500'} ${!isValid ? 'border border-red-500' : 'border border-transparent'}`}
                placeholder={readOnly ? "No content" : "Enter valid JSON here..."}
            />
            {!readOnly && !isValid && value.trim() !== '' && (
                <div className="absolute bottom-2 right-2 text-xs text-red-400 bg-red-900/50 px-2 py-1 rounded-md">
                    Invalid JSON
                </div>
            )}
        </div>
    );
};

export default JsonEditor;