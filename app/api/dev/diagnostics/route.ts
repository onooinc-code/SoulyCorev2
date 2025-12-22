
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getEdgeDBClient } from '@/lib/graphdb';
import clientPromise from '@/lib/mongodb';
import { getKnowledgeBaseIndex } from '@/lib/pinecone';
import { Index } from "@upstash/vector";

export const dynamic = 'force-dynamic';

export async function GET() {
    const results: Record<string, any> = {
        postgres: { status: 'testing' },
        pinecone: { status: 'testing' },
        mongodb: { status: 'testing' },
        edgedb: { status: 'testing' },
        upstash: { status: 'testing' }
    };

    // 1. Postgres Check
    try {
        const pgStart = Date.now();
        await sql`SELECT 1`;
        results.postgres = { status: 'healthy', latency: Date.now() - pgStart };
    } catch (e) { results.postgres = { status: 'error', message: (e as Error).message }; }

    // 2. EdgeDB Check
    try {
        const edgeStart = Date.now();
        const client = getEdgeDBClient();
        await client.query(`SELECT 1`);
        results.edgedb = { status: 'healthy', latency: Date.now() - edgeStart };
    } catch (e) { results.edgedb = { status: 'error', message: (e as Error).message }; }

    // 3. MongoDB Check
    try {
        const mongoStart = Date.now();
        const client = await clientPromise;
        await client.db('soulycore_data').command({ ping: 1 });
        results.mongodb = { status: 'healthy', latency: Date.now() - mongoStart };
    } catch (e) { results.mongodb = { status: 'error', message: (e as Error).message }; }

    // 4. Pinecone Check
    try {
        const pcStart = Date.now();
        const index = getKnowledgeBaseIndex();
        if (index) {
            const stats = await index.describeIndexStats();
            results.pinecone = { status: 'healthy', latency: Date.now() - pcStart, vectors: stats.totalRecordCount };
        } else { results.pinecone = { status: 'not_configured' }; }
    } catch (e) { results.pinecone = { status: 'error', message: (e as Error).message }; }

    // 5. Upstash Check
    try {
        const upStart = Date.now();
        if (process.env.UPSTASH_VECTOR_REST_URL) {
            const index = new Index({ url: process.env.UPSTASH_VECTOR_REST_URL, token: process.env.UPSTASH_VECTOR_REST_TOKEN! });
            const stats = await index.info();
            results.upstash = { status: 'healthy', latency: Date.now() - upStart, vectors: stats.vectorCount };
        } else { results.upstash = { status: 'not_configured' }; }
    } catch (e) { results.upstash = { status: 'error', message: (e as Error).message }; }

    return NextResponse.json(results);
}
