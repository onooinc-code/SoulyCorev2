import { NextRequest, NextResponse } from 'next/server';
import { PostgresDataSourceRepository } from '@/core/repositories/PostgresDataSourceRepository';

const repository = new PostgresDataSourceRepository();

export async function GET(req: NextRequest, { params }: { params: { dataSourceId: string } }) {
    try {
        const { dataSourceId } = params;
        const dataSource = await repository.getById(dataSourceId);
        if (!dataSource) {
            return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
        }
        return NextResponse.json(dataSource);
    } catch (error) {
         console.error(`Failed to fetch data source ${params.dataSourceId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { dataSourceId: string } }) {
    try {
        const { dataSourceId } = params;
        const body = await req.json();
        const updatedDataSource = await repository.save({ id: dataSourceId, ...body });
        return NextResponse.json(updatedDataSource);
    } catch (error) {
        console.error(`Failed to update data source ${params.dataSourceId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { dataSourceId: string } }) {
    try {
        const { dataSourceId } = params;
        await repository.delete(dataSourceId);
        return NextResponse.json({ message: 'Data source deleted successfully' });
    } catch (error) {
        console.error(`Failed to delete data source ${params.dataSourceId}:`, error);
        const errorDetails = { message: (error as Error).message, stack: (error as Error).stack };
        return NextResponse.json({ error: 'Internal Server Error', details: errorDetails }, { status: 500 });
    }
}
