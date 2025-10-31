import { createClient, type VercelKV } from "@vercel/kv";

let kvInstance: VercelKV | null = null;

/**
 * Lazily initializes and returns the Vercel KV client instance.
 * This prevents module-level crashes on Vercel if environment variables are missing.
 * @returns {VercelKV} The initialized Vercel KV client.
 */
export function getKVClient(): VercelKV {
    if (!kvInstance) {
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            throw new Error('Vercel KV environment variables (KV_REST_API_URL, KV_REST_API_TOKEN) are not set. Please add them to your Vercel project settings.');
        }
        kvInstance = createClient({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
    }
    return kvInstance;
}
