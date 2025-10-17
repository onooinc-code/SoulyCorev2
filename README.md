# HedraCore: The Definitive Developer's Guide

**Version:** 0.3.0
**Status:** Live (Reflects Cognitive Architecture v2.0)

---

## 1. Welcome to HedraCore

**HedraCore** is a next-generation, AI-powered assistant built on the foundational principle of a persistent, intelligent, and multi-faceted memory. It functions as a true **Total Recall Companion**, actively learning from every interaction to become an indispensable partner for managing complex information and executing sophisticated workflows.

---

## 2. The Authoritative Guide

This `README.md` file serves as a quick entry point to the project.

For a complete and detailed understanding of the project's vision, architecture, features, and development protocols, please refer to the single source of truth:

### **[-> Read the Full Project Guide](./PROJECT_GUIDE.md)**

The `PROJECT_GUIDE.md` file contains:
-   A deep dive into the **System Architecture** and **Cognitive Model**.
-   A detailed breakdown of the **Technology Stack** and **Project Structure**.
-   A comprehensive **Feature Registry** detailing every hub and its capabilities.
-   The mandatory **Development Workflow & Rules** for all contributors.
-   The future **Roadmap** and important technical notes.

---

## 3. Quick Start

### Prerequisites
- Node.js (v18+)
- Vercel, Pinecone, and Google AI accounts.

### Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    - Create a `.env.local` file by copying `.env.example` (if it exists) and fill in all the required API keys and database URLs.
3.  **Initialize Database:**
    ```bash
    npm run db:create
    npm run db:seed
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.