import { createClient, type VercelKV } from "@vercel/kv";

let kvInstance: VercelKV | null = null;
let hasBeenInitialized = false;

/**
 * Lazily initializes and returns the Vercel KV client instance.
 * This prevents module-level crashes on Vercel if environment variables are missing.
 * @returns {VercelKV | null} The initialized Vercel KV client, or null if not configured.
 */
export function getKVClient(): VercelKV | null {
    if (hasBeenInitialized) {
        return kvInstance;
    }
    
    hasBeenInitialized = true; // Set this at the beginning of the first call

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.warn('Vercel KV environment variables not set. KV-dependent features will run in local-only mode.');
        kvInstance = null;
        return null;
    }
    
    try {
        kvInstance = createClient({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
        return kvInstance;
    } catch (error) {
        console.error("Failed to initialize Vercel KV client:", error);
        kvInstance = null;
        return null;
    }
}
