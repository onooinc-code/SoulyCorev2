import { sql } from '@/lib/db';
import type { DataSource } from '@/lib/types';
import { IDataSourceRepository } from './IDataSourceRepository';

export class PostgresDataSourceRepository implements IDataSourceRepository {

    private mapRowToDataSource(row: any): DataSource {
        // FIX: The database returns camelCase column names as defined in the schema.
        const { statsJson, configJson, ...rest } = row;
        return {
            ...rest,
            statsJson: statsJson || [],
            configJson: configJson || {},
            createdAt: new Date(row.createdAt),
            lastUpdatedAt: new Date(row.lastUpdatedAt),
        } as DataSource;
    }

    async getById(id: string): Promise<DataSource | null> {
        const { rows } = await sql`
            SELECT * FROM data_sources WHERE id = ${id};
        `;
        if (rows.length === 0) {
            return null;
        }
        return this.mapRowToDataSource(rows[0]);
    }
    
    async getByName(name: string): Promise<DataSource | null> {
        const { rows } = await sql`
            SELECT * FROM data_sources WHERE name = ${name};
        `;
         if (rows.length === 0) {
            return null;
        }
        return this.mapRowToDataSource(rows[0]);
    }

    async getAll(): Promise<DataSource[]> {
        const { rows } = await sql`
            SELECT * FROM data_sources ORDER BY name ASC;
        `;
        return rows.map(this.mapRowToDataSource);
    }

    async save(source: Partial<DataSource>): Promise<DataSource> {
        if (source.id) {
            // Update logic
            const existing = await this.getById(source.id);
            if (!existing) {
                throw new Error(`DataSource with id ${source.id} not found for update.`);
            }
            const toUpdate = { ...existing, ...source };
            const { rows } = await sql`
                UPDATE data_sources
                SET 
                    name = ${toUpdate.name},
                    provider = ${toUpdate.provider},
                    type = ${toUpdate.type},
                    status = ${toUpdate.status},
                    "configJson" = ${JSON.stringify(toUpdate.configJson || {})},
                    "statsJson" = ${JSON.stringify(toUpdate.statsJson || [])},
                    "lastUpdatedAt" = CURRENT_TIMESTAMP
                WHERE id = ${source.id}
                RETURNING *;
            `;
            return this.mapRowToDataSource(rows[0]);
        } else {
            // Create logic
            // FIX: Use camelCase properties to match the 'DataSource' type.
            const { name, provider, type, status, configJson, statsJson } = source;
            if (!name || !provider || !type) {
                 throw new Error('Name, provider, and type are required to create a new DataSource.');
            }
             const { rows } = await sql`
                INSERT INTO data_sources (name, provider, type, status, "configJson", "statsJson", "lastUpdatedAt")
                VALUES (${name}, ${provider}, ${type}, ${status || 'needs_config'}, ${JSON.stringify(configJson || {})}, ${JSON.stringify(statsJson || [])}, CURRENT_TIMESTAMP)
                RETURNING *;
            `;
            return this.mapRowToDataSource(rows[0]);
        }
    }

    async delete(id: string): Promise<void> {
        const { rowCount } = await sql`
            DELETE FROM data_sources WHERE id = ${id};
        `;
        if (rowCount === 0) {
            throw new Error(`DataSource with id ${id} not found for deletion.`);
        }
    }
}