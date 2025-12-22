
// core/memory/modules/profile.ts
import { ISingleMemoryModule } from '../types';
import { sql } from '@/lib/db';

export class ProfileMemoryModule implements ISingleMemoryModule {
    private readonly KEY = 'user_profile_data';

    async query(params: Record<string, any>): Promise<any> {
        const { rows } = await sql`SELECT value FROM settings WHERE key = ${this.KEY}`;
        if (rows.length > 0) {
            return rows[0].value;
        }
        return { name: 'User', aiName: 'SoulyCore', role: null, preferences: [], facts: [] };
    }

    async store(params: { name?: string, aiName?: string, role?: string, preferences?: string[], preference?: string, fact?: string }): Promise<any> {
        let currentProfile = await this.query({});
        
        if (params.name) currentProfile.name = params.name;
        if (params.aiName) currentProfile.aiName = params.aiName;
        if (params.role) currentProfile.role = params.role;

        if (params.preferences) {
            currentProfile.preferences = [...new Set([...(currentProfile.preferences || []), ...params.preferences])];
        }
        if (params.preference) {
            currentProfile.preferences = [...new Set([...(currentProfile.preferences || []), params.preference])];
        }
        if (params.fact) {
            currentProfile.facts = [...new Set([...(currentProfile.facts || []), params.fact])];
        }

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
