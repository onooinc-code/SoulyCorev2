"use client";

import React, { useState, useCallback } from 'react';
import { useNotification } from '@/lib/hooks/use-notifications';
import ExtractionResults from './ExtractionResults';
import { DocumentTextIcon, ArrowDownOnSquareIcon } from '@/components/Icons';

const DocumentExtractor = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const { addNotification } = useNotification();
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (selectedFile: File | null) => {
        if (selectedFile) {
            const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
            const isAllowed = allowedTypes.includes(selectedFile.type) || (fileExtension === 'md');

            if (!isAllowed) {
                addNotification({ type: 'error', title: 'Invalid File Type', message: 'Please upload a .txt, .md, or .pdf file.' });
                return;
            }
            setFile(selectedFile);
            setResults(null); // Clear previous results
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleExtract = async () => {
        if (!file) {
            addNotification({ type: 'warning', title: 'No file selected' });
            return;
        }

        setIsLoading(true);
        setResults(null);
        addNotification({ type: 'info', title: 'Starting Extraction...', message: 'Uploading and analyzing document. This may take a moment.' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/memory/extract-from-document', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to extract memory from document.');
            }
            
            setResults(data);
            addNotification({ type: 'success', title: 'Extraction Complete', message: 'Review the extracted information below.' });
        } catch (error) {
            addNotification({ type: 'error', title: 'Extraction Failed', message: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 h-full flex flex-col" onDragEnter={handleDrag}>
            <div className="flex-shrink-0 flex flex-col items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} className="w-full">
                    <label htmlFor="input-file-upload" className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? 'border-indigo-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700'}`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <DocumentTextIcon className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">TXT, MD, or PDF files</p>
                        </div>
                        <input id="input-file-upload" type="file" className="hidden" accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                    </label>
                     { dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div> }
                </form>

                {file && (
                    <div className="w-full text-center text-sm text-gray-300">
                        Selected file: <span className="font-semibold">{file.name}</span>
                    </div>
                )}

                <button
                    onClick={handleExtract}
                    disabled={isLoading || !file}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <ArrowDownOnSquareIcon className="w-5 h-5" />
                    {isLoading ? 'Extracting...' : 'Extract Memory from Document'}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4">
                <ExtractionResults data={results} />
                {isLoading && <div className="text-center p-8"><p className="animate-pulse">Analyzing document with Gemini...</p></div>}
                {!isLoading && !results && !file && <div className="text-center p-8 text-gray-500"><p>Upload a document to begin memory extraction.</p></div>}
            </div>
        </div>
    );
};

export default DocumentExtractor;
