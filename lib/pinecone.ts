import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
}

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export const knowledgeBaseIndex = pinecone.index<{ text: string }>('soul-knowledgebase');

export default pinecone;
