import { Pinecone, type Index } from '@pinecone-database/pinecone';

let pineconeInstance: Pinecone | null = null;
let indexInstance: Index<{ text: string }> | null = null;

function getClient(): Pinecone {
    if (!pineconeInstance) {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY environment variable is not set. Please add it to your Vercel project settings.');
        }
        pineconeInstance = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return pineconeInstance;
}

export function getKnowledgeBaseIndex(): Index<{ text: string }> {
    if (!indexInstance) {
        const client = getClient();
        indexInstance = client.index<{ text: string }>('soul-knowledgebase');
    }
    return indexInstance;
}
