
# SoulyCore v2: Security Model

**Document Version:** 1.0
**Status:** Live

---

### 1. Guiding Principle: Server-Side Trust

The security model of SoulyCore is built on the principle that the client-side application is untrusted. All sensitive operations, data access, and interactions with external services are handled exclusively by the server-side Vercel Functions (Next.js API Routes). The frontend's role is limited to rendering data and sending user input to the secure backend.

### 2. API & Credential Security

*   **No Exposed Keys:** Sensitive credentials, such as the Google Gemini `API_KEY`, `PINECONE_API_KEY`, and database connection strings (`POSTGRES_URL`), are **never** exposed to the client-side.
*   **Environment Variables:** All secrets are managed as environment variables within the Vercel platform. They are securely injected into the serverless function's runtime environment and are not part of the frontend JavaScript bundle.
*   **Backend-Only SDKs:** The `@google/genai` and `@pinecone-database/pinecone` SDKs, as well as the `@vercel/postgres` client, are only ever initialized and used within the server-side code (`app/api/` and `core/` directories).

### 3. Data Protection

#### 3.1. Data in Transit
All communication between the user's browser and the Vercel-hosted backend is secured with **HTTPS**, which is enabled by default on all Vercel deployments. This ensures that all request and response data is encrypted during transit.

#### 3.2. Data at Rest
The application relies on the robust security features of its managed data providers:
*   **Vercel Postgres:** All data stored in the Postgres database is encrypted at rest by default.
*   **Pinecone:** All vector data and metadata stored in the Pinecone index are encrypted at rest by default.
*   **Vercel KV:** All data stored in the Redis-based KV store is encrypted at rest.

### 4. Data Isolation (Multi-Brain Architecture)

The "Multi-Brain" architecture provides a critical layer of logical data security.
*   **Namespacing:** By design, each "Brain" operates within its own `namespace` in the memory stores.
*   **No Cross-Contamination:** The Core Engine's logic ensures that one Brain (e.g., "Personal Brain") cannot access the memory namespaces assigned to another (e.g., "Work Brain"). This prevents accidental context leakage between different operational domains.

### 5. Future Considerations (For Multi-User/Team Versions)

The current application is designed for a single, trusted user. Evolving to a multi-tenant or team-based system would require implementing the following:

*   **User Authentication:** A robust authentication system (e.g., NextAuth.js, Clerk) would be the first priority to identify and authorize users.
*   **Row-Level Security (RLS):** Policies would need to be implemented in the Postgres database to ensure that users can only access data (conversations, contacts, etc.) that they own or have been granted access to.
*   **API Authorization:** All API endpoints would need to be updated to check the user's session and verify their permissions before executing any operation.
