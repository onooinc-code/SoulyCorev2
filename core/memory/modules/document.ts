
import { ISingleMemoryModule } from '../types';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export class DocumentMemoryModule implements ISingleMemoryModule {
    private dbName = 'soulycore_data';
    private collectionName = 'archives';

    private isConfigured(): boolean {
        return !!process.env.MONGODB_URI;
    }

    async store(params: { data: any, type?: string }): Promise<any> {
        if (!this.isConfigured()) {
            console.warn("DocumentMemoryModule: MongoDB not configured. Skipping store.");
            return null;
        }

        try {
            const client = await clientPromise;
            const db = client.db(this.dbName);
            const collection = db.collection(this.collectionName);

            const document = {
                ...params.data,
                type: params.type || 'generic',
                createdAt: new Date(),
            };

            const result = await collection.insertOne(document);
            return result.insertedId.toString();
        } catch (error) {
            console.error("MongoDB Store Error:", error);
            return null;
        }
    }

    // Enhanced query to accept any filter criteria
    async query(params: Record<string, any>): Promise<any[]> {
        if (!this.isConfigured()) return [];

        try {
            const client = await clientPromise;
            const db = client.db(this.dbName);
            const collection = db.collection(this.collectionName);

            // Extract limit if present, otherwise use rest as filter
            const { limit, ...filter } = params;
            const limitVal = typeof limit === 'number' ? limit : 50;

            return await collection.find(filter).sort({ createdAt: -1 }).limit(limitVal).toArray();
        } catch (error) {
            console.error("MongoDB Query Error:", error);
            return [];
        }
    }

    // New delete method
    async delete(id: string): Promise<boolean> {
        if (!this.isConfigured()) return false;
        try {
            const client = await clientPromise;
            const db = client.db(this.dbName);
            const collection = db.collection(this.collectionName);
            
            const result = await collection.deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount === 1;
        } catch (error) {
            console.error("MongoDB Delete Error:", error);
            return false;
        }
    }
}
