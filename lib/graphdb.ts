import * as edgedb from "edgedb";
import { Client } from "edgedb";

let client: Client | null = null;

/**
 * Returns a singleton instance of the EdgeDB client.
 * It automatically uses environment variables on Vercel.
 */
export function getEdgeDBClient(): Client {
    if (!client) {
        client = edgedb.createClient();
    }
    return client;
}
