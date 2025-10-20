# SoulyCore: The Total Recall AI Companion

**Version:** 0.4.0 (Cognitive Architecture v2.0)
**Status:** Development Complete

---

## 1. Vision: The Total Recall Companion

**SoulyCore** is a next-generation, AI-powered assistant built for a single power user. Its foundational principle is a persistent, intelligent, and multi-faceted memory. It functions as a true **Total Recall Companion**, actively learning from every interaction to become an indispensable partner for managing complex information and executing sophisticated workflows.

---

## 2. Core Features

- **Persistent, Multi-Layered Memory:** Combines episodic (Postgres), semantic (Pinecone), and structured (Postgres) memory to retain context and knowledge indefinitely.
- **Autonomous Agent Center:** Define high-level goals and launch autonomous agents that generate and execute their own plans.
- **Cognitive Architecture Hubs:** A suite of powerful UI centers for managing every aspect of the AI's "Brain," memory modules, and capabilities (Tools, Prompts, Tasks, Contacts).
- **Integrated Developer Environment:** The **SoulyDev Center** provides a Postman-like API tester, a live feature health dashboard, and an interactive documentation system, making the project self-documenting and easy to maintain.
- **Dynamic Workflows:** A visual builder to create multi-step prompt and tool chains for automating complex tasks.

---

## 3. The Definitive Guide

This `README.md` provides a high-level overview. For a complete and detailed understanding of the project's vision, architecture, features, and development protocols, please refer to the single source of truth:

### **[-> Read the Full Project Guide](./PROJECT_GUIDE.md)**

---

## 4. Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Vercel, Pinecone, and Google AI accounts.

### Local Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    - Create a `.env.local` file in the project root and populate it with your API keys and database URLs from Vercel, Pinecone, and Google AI Studio.

3.  **Initialize Database:**
    ```bash
    npm run db:create && npm run db:seed
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

### Deployment
Deployment is streamlined via Vercel. Simply import the Git repository into a new Vercel project, connect the Postgres and KV storage integrations, add your remaining API keys as environment variables, and deploy. The `postinstall` script will automatically initialize the production database.