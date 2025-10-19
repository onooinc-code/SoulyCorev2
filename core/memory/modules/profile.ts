/**
 * @fileoverview Implements the Profile Memory Module using MongoDB Atlas.
 * This module stores and retrieves user-specific profile information, preferences, and implicit data.
 */

import clientPromise from '@/lib/mongodb';
import { ISingleMemoryModule } from '../types';

const DB_NAME = 'soulycore';
const COLLECTION_NAME = 'profiles';
const DEFAULT_USER_ID = 'default_user'; // Placeholder until auth is implemented

/**
 * Implements the ISingleMemoryModule interface for user profile data using MongoDB.
 */
export class ProfileMemoryModule implements ISingleMemoryModule {
    
    private async getCollection() {
        const client = await clientPromise;
        return client.db(DB_NAME).collection(COLLECTION_NAME);
    }

    /**
     * @inheritdoc
     * Queries the user's profile data from MongoDB.
     * @param params - An object that can contain a 'key' to retrieve a specific part of the profile.
     * @returns A promise that resolves with the profile data.
     */
    async query(params: { key?: string; userId?: string }): Promise<any> {
        const userId = params.userId || DEFAULT_USER_ID;
        const collection = await this.getCollection();
        
        const profile = await collection.findOne({ _id: userId });

        if (!profile) {
            return null; // Or return a default profile structure
        }

        if (params.key) {
            // Allows dot notation for nested queries, e.g., 'preferences.theme'
            return params.key.split('.').reduce((o, i) => (o ? o[i] : null), profile.data);
        }

        return profile.data;
    }

    /**
     * @inheritdoc
     * Stores or updates data in the user's profile in MongoDB.
     * @param params - An object containing the userId and the data to update.
     * @returns A promise that resolves with the updated profile data.
     */
    async store(params: { userId?: string; data: Record<string, any> }): Promise<any> {
        if (!params.data) {
            throw new Error("ProfileMemoryModule.store requires a 'data' object.");
        }
        
        const userId = params.userId || DEFAULT_USER_ID;
        const collection = await this.getCollection();

        // Use dot notation for nested updates
        const updateDoc: Record<string, any> = {};
        for (const key in params.data) {
            updateDoc[`data.${key}`] = params.data[key];
        }

        const result = await collection.updateOne(
            { _id: userId },
            { 
                $set: updateDoc,
                $setOnInsert: { _id: userId }
            },
            { upsert: true }
        );

        if (result.acknowledged) {
            return this.query({ userId });
        } else {
            throw new Error("Failed to store profile data.");
        }
    }
}
