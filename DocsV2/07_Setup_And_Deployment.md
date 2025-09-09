
# SoulyCore v2: Setup & Deployment Guide

**Document Version:** 1.0
**Status:** Live

---

### 1. Prerequisites

Before you begin, ensure you have the following installed on your local machine:
-   **Node.js** (v18 or later recommended)
-   **npm** or **yarn**
-   **Git**

You will also need accounts for the following services:
-   A **Vercel** account for deployment.
-   A **Vercel Postgres** database.
-   A **Pinecone** account for the vector database.
-   A **Google AI** account to get a Gemini API Key.

### 2. Local Development Setup

#### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd soulycore-next-final
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment Variables
Create a new file named `.env.local` in the root of the project. This file is ignored by Git and will hold your secret keys. Populate it with the following variables:

```env
# Get from Google AI Studio (can be named API_KEY or GEMINI_API_KEY)
API_KEY="your_gemini_api_key"

# Get from your Pinecone dashboard
PINECONE_API_KEY="your_pinecone_api_key"

# The following are provided by your Vercel Postgres integration
POSTGRES_URL="your_vercel_postgres_connection_url"
POSTGRES_PRISMA_URL="..."
POSTGRES_URL_NON_POOLING="..."
POSTGRES_USER="..."
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="..."

# Note: Vercel KV is used for Working Memory. Its connection string
# is also provided by the Vercel integration.
KV_URL="..."
KV_REST_API_URL="..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

#### Step 4: Initialize the Database
The project includes scripts to create all necessary database tables and seed them with initial data for the developer tools.

```bash
# Creates all tables defined in scripts/create-tables.js
npm run db:create

# Seeds the features and api_endpoints tables
npm run db:seed
```

#### Step 5: Run the Development Server
```bash
npm run dev
```
The application should now be running at `http://localhost:3000`.

---

### 3. Deployment to Vercel

Deployment is streamlined through Vercel's deep integration with Next.js and its data services.

#### Step 1: Push to a Git Provider
Push your project code to a repository on GitHub, GitLab, or Bitbucket.

#### Step 2: Create a Vercel Project
1.  Log in to your Vercel dashboard.
2.  Click "Add New... -> Project".
3.  Import your Git repository. Vercel will automatically detect that it's a Next.js project.

#### Step 3: Connect Storage Integrations
1.  In your new Vercel project's dashboard, navigate to the **Storage** tab.
2.  Connect your **Vercel Postgres** database to the project.
3.  Connect your **Vercel KV** database to the project.
4.  Vercel will automatically create and link all the necessary `POSTGRES_*` and `KV_*` environment variables to your project.

#### Step 4: Set Remaining Environment Variables
1.  Navigate to the **Settings -> Environment Variables** tab in your Vercel project.
2.  Add your `API_KEY` (or `GEMINI_API_KEY`) and `PINECONE_API_KEY` with their respective values. Ensure they are available to all environments (Production, Preview, Development).

#### Step 5: Deploy
1.  Navigate to the **Deployments** tab and trigger a new deployment for the `main` branch.
2.  On the first deployment, Vercel will run the `postinstall` script defined in `package.json`. This automatically executes `npm run db:create` and `npm run db:seed`, setting up your production database tables and initial data.
3.  Once the deployment is complete, your SoulyCore application will be live.
