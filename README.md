# SoulyCore: The Total Recall AI Companion

**Version:** 0.4.0 (Cognitive Architecture v2.0)
**Status:** Live

---

## 1. Project Overview

**SoulyCore** is a next-generation, AI-powered assistant built for a single power user. Its foundational principle is a persistent, intelligent, and multi-faceted memory that actively learns from every interaction.

---

## 2. The Definitive Guide

This `README.md` provides a high-level overview. For a complete and detailed understanding of the project's vision, architecture, features, and development protocols, please refer to the single source of truth:

### **[-> Read the Full Project Guide](./PROJECT_GUIDE.md)**

---

## 3. Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Vercel, Pinecone, and Google AI accounts.

### Local Setup
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    - Create a `.env.local` file in the project root and populate it with your API keys and database URLs.

3.  **Initialize & Seed Database:**
    ```bash
    npm run db:create && npm run db:seed
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.
