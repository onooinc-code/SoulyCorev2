
import { ISingleMemoryModule } from '../types';
import clientPromise from '@/lib/mongodb';

export class DocumentMemoryModule implements ISingleMemoryModule {
    private dbName = 'soulycore_data';
    private collectionName = 'archives';

    async store(params: { data: any, type?: string }): Promise<any> {
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

    async query(params: { type?: string, limit?: number }): Promise<any[]> {
        try {
            const client = await clientPromise;
            const db = client.db(this.dbName);
            const collection = db.collection(this.collectionName);

            const filter = params.type ? { type: params.type } : {};
            const limit = params.limit || 10;

            return await collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
        } catch (error) {
            console.error("MongoDB Query Error:", error);
            return [];
        }
    }
}
