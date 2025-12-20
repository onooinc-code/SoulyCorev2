
import { ISingleMemoryModule } from '../types';
import { sql } from '@/lib/db';

export class ProfileMemoryModule implements ISingleMemoryModule {
    private readonly KEY = 'user_profile_data';

    async query(params: Record<string, any>): Promise<any> {
        // Fetch the full user profile
        const { rows } = await sql`SELECT value FROM settings WHERE key = ${this.KEY}`;
        if (rows.length > 0) {
            return rows[0].value;
        }
        return { name: 'User', preferences: [], facts: [] };
    }

    async store(params: { preference?: string, fact?: string }): Promise<any> {
        // Get current profile
        let currentProfile = await this.query({});
        
        // Update logic
        if (params.preference) {
            currentProfile.preferences = [...(currentProfile.preferences || []), params.preference];
            // Remove duplicates
            currentProfile.preferences = [...new Set(currentProfile.preferences)];
        }
        if (params.fact) {
            currentProfile.facts = [...(currentProfile.facts || []), params.fact];
            currentProfile.facts = [...new Set(currentProfile.facts)];
        }

        // Save back to DB
        await sql`
            INSERT INTO settings (key, value, "lastUpdatedAt")
            VALUES (${this.KEY}, ${JSON.stringify(currentProfile)}, NOW())
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                "lastUpdatedAt" = NOW();
        `;
        
        return currentProfile;
    }
}
