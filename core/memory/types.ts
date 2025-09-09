/**
 * @fileoverview Centralized type definitions for the SoulyCore Cognitive Architecture v2.0.
 * This file establishes the data contracts for Brains, Memory Modules, and Pipelines.
 */

/**
 * Represents the configuration for a single AI Agent's "Brain".
 * It holds the metadata and the namespace mappings for its associated memory modules.
 */
export interface IBrain {
    id: string;
    name: string;
    /**
     * Maps a memory module type to a specific namespace for data isolation.
     * e.g., { episodic: 'brain_xyz_episodes', semantic: 'brain_xyz_knowledge' }
     */
    moduleNamespaces: Record<string, string>;
}

/**
 * A generic interface that all Single Memory Modules (SMMs) must implement.
 * This ensures a consistent API for the Core Engine to interact with different memory types.
 */
export interface ISingleMemoryModule {
    /**
     * Queries the memory module for information.
     * @param params - A flexible object containing query parameters.
     * @returns A promise that resolves with the query results.
     */
    query(params: Record<string, any>): Promise<any>;

    /**
     * Stores or updates information in the memory module.
     * @param params - A flexible object containing the data to be stored.
     * @returns A promise that resolves when the store operation is complete.
     */
    store(params: Record<string, any>): Promise<void>;
}

/**
 * Configuration options for the Context Assembly Pipeline (Read Path).
 */
export interface IContextAssemblyConfig {
    /**
     * Number of recent messages to retrieve from episodic memory.
     */
    episodicMemoryDepth: number;
    /**
     * Number of relevant knowledge chunks to retrieve from semantic memory.
     */
    semanticMemoryTopK: number;
}

/**
 * Configuration options for the Memory Extraction Pipeline (Write Path).
 */
export interface IMemoryExtractionConfig {
    /**
     * Flag to enable or disable entity extraction.
     */
    enableEntityExtraction: boolean;
    /**
     * Flag to enable or disable knowledge chunk extraction.
     */
    enableKnowledgeExtraction: boolean;
}
