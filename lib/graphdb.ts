import * as edgedb from "edgedb";
import { Client } from "edgedb";

let client: Client | null = null;

/**
 * Returns a singleton instance of the EdgeDB client.
 * It automatically uses environment variables when deployed on Vercel.
 */
export function getEdgeDBClient(): Client {
    if (!client) {
        // createClient() will automatically use environment variables
        // when deployed on Vercel. No need to pass credentials here.
        client = edgedb.createClient();
    }
    return client;
}
