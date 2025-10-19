import type { DataSource } from '@/lib/types';

/**
 * @interface IDataSourceRepository
 * @description Defines the contract for managing DataSource configurations in the persistence layer.
 * This acts as an abstraction between the application logic and the database.
 */
export interface IDataSourceRepository {
    /**
     * Retrieves a single data source by its unique ID.
     * @param id The UUID of the data source.
     * @returns A Promise that resolves to the DataSource object or null if not found.
     */
    getById(id: string): Promise<DataSource | null>;

    /**
     * Retrieves a single data source by its unique name.
     * This is useful for checking if a source already exists.
     * @param name The unique name of the data source.
     * @returns A Promise that resolves to the DataSource object or null if not found.
     */
    getByName(name: string): Promise<DataSource | null>;

    /**
     * Retrieves all data sources from the database.
     * @returns A Promise that resolves to an array of all DataSource objects.
     */
    getAll(): Promise<DataSource[]>;

    /**
     * Saves (creates or updates) a data source configuration.
     * @param source A partial DataSource object containing the data to save.
     * @returns A Promise that resolves to the fully saved DataSource object.
     */
    save(source: Partial<DataSource>): Promise<DataSource>;

    /**
     * Deletes a data source by its unique ID.
     * @param id The UUID of the data source to delete.
     * @returns A Promise that resolves when the deletion is complete.
     */
    delete(id: string): Promise<void>;
}