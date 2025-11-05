import { Pinecone, type Index } from '@pinecone-database/pinecone';

let pineconeInstance: Pinecone | null = null;
let indexInstance: Index | null = null;
let hasBeenInitialized = false;

const INDEX_NAME = 'soul-knowledgebase';

function getClient(): Pinecone | null {
    if (hasBeenInitialized) {
        return pineconeInstance;
    }
    hasBeenInitialized = true;

    if (!process.env.PINECONE_API_KEY) {
        console.warn('PINECONE_API_KEY environment variable is not set. Semantic memory will be disabled.');
        pineconeInstance = null;
        return null;
    }

    try {
        pineconeInstance = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        return pineconeInstance;
    } catch (error) {
        console.error("Failed to initialize Pinecone client:", error);
        pineconeInstance = null;
        return null;
    }
}

export function getKnowledgeBaseIndex(): Index | null {
    if (indexInstance) {
        return indexInstance;
    }

    const client = getClient();
    if (!client) {
        return null;
    }

    try {
        indexInstance = client.index(INDEX_NAME);
        return indexInstance;
    } catch (error) {
        console.error(`Failed to get Pinecone index '${INDEX_NAME}':`, error);
        return null;
    }
}