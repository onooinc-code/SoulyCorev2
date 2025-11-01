import { createPool, sql, type VercelPool } from '@vercel/postgres';

let pool: VercelPool | null = null;

function getDbPool(): VercelPool {
    if (pool) {
        return pool;
    }
    if (!process.env.POSTGRES_URL) {
        throw new Error('Postgres connection details are missing. Please link a Vercel Postgres database and ensure environment variables are set in your Vercel project settings.');
    }
    // createPool is the recommended way to instantiate a client pool.
    pool = createPool({
        connectionString: process.env.POSTGRES_URL,
    });
    return pool;
}

// To maintain compatibility with existing code that uses `db.query` or `db.connect`,
// we create a proxy-like object that lazy-initializes the pool on first use.
const db = {
    query: (query: string, values?: any[]) => {
        return getDbPool().query(query, values);
    },
    connect: () => {
        return getDbPool().connect();
    },
    // Add other VercelPool methods here if they are used elsewhere.
};

export { sql, db };
