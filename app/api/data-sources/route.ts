import { NextRequest, NextResponse } from 'next/server';
import { PostgresDataSourceRepository } from '@/core/repositories/PostgresDataSourceRepository';

export const dynamic = 'force-dynamic';
const repository = new PostgresDataSourceRepository();

export async function GET() {
    try {
        const dataSources = await repository.getAll();
        return NextResponse.json(dataSources);
    } catch (error) {
        console.error('Failed to fetch data sources:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const newDataSource = await repository.save(body);
        return NextResponse.json(newDataSource, { status: 201 });
    } catch (error) {
        console.error('Failed to create data source:', error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}