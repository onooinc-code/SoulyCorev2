// scripts/seed-features.js
const { sql } = require('@vercel/postgres');

const features = [
    // ... (All 50+ new feature definitions go here, based on the codebase analysis)
    // Core Cognitive Engine
    { name: "Core: Context Assembly Pipeline", overview: "The 'Read Path' that gathers context from all memory modules before calling the LLM.", status: "✅ Completed" },
    { name: "Core: Memory Extraction Pipeline", overview: "The 'Write Path' that analyzes conversations to extract and store knowledge asynchronously.", status: "✅ Completed" },
    { name: "Core: Autonomous Agent Engine", overview: "The engine that takes a high-level goal, generates a plan, and executes it step-by-step.", status: "✅ Completed" },
    { name: "Core: Experience Consolidation", overview: "A background pipeline that learns from successful agent runs to create reusable 'experiences'.", status: "✅ Completed" },
    { name: "Core: Hybrid Memory System", overview: "The foundational architecture combining Postgres (Episodic/Structured) and Pinecone (Semantic) memory.", status: "✅ Completed" },
    { name: "Core: Multi-Brain Architecture", overview: "Allows for multiple, isolated 'Brains' (e.g., Work, Personal) with distinct memory namespaces.", status: "✅ Completed" },
    
    // UI: Main Hubs & Centers
    { name: "UI: Dashboard Center", overview: "The main landing page providing a high-level overview of the entire system.", status: "✅ Completed" },
    { name: "UI: Agent Center", overview: "A hub for launching, monitoring, and reviewing autonomous agent runs.", status: "✅ Completed" },
    { name: "UI: Brain Center", overview: "A hub for managing Brain configurations and inspecting raw memory module data.", status: "✅ Completed" },
    { name: "UI: Memory Center", overview: "The hub for managing structured memory, including Entities and Relationships.", status: "✅ Completed" },
    { name: "UI: Contacts Hub", overview: "A dedicated UI for managing personal and professional contacts (a part of Structured Memory).", status: "✅ Completed" },
    { name: "UI: Prompts Hub", overview: "A system for creating, managing, and using reusable prompt templates and multi-step workflows.", status: "✅ Completed" },
    { name: "UI: Tools Hub", overview: "An interface for managing the agent's capabilities (tools) and their schemas.", status: "✅ Completed" },
    { name: "UI: Projects Hub", overview: "A hub for managing projects and their associated tasks, including AI-powered summaries.", status: "✅ Completed" },
    { name: "UI: Experiences Hub", overview: "A UI to view and manage the generalized plans learned from successful agent runs.", status: "✅ Completed" },
    { name: "UI: Data Hub", overview: "A dashboard for monitoring and managing all connected data sources and storage services.", status: "✅ Completed" },
    { name: "UI: Communication Hub", overview: "A hub for managing inbound and outbound communication channels.", status: "✅ Completed" },
    { name: "UI: SoulyDev Center", overview: "An integrated developer control panel with API testing, feature health dashboards, and documentation.", status: "✅ Completed" },

    // UI: Chat & Conversation
    { name: "UI: Chat Interface", overview: "The main conversational UI for interacting with the agent.", status: "✅ Completed" },
    { name: "UI: Message Toolbar", overview: "A hover-toolbar on messages for actions like copy, bookmark, summarize, and inspect.", status: "✅ Completed" },
    { name: "UI: Cognitive Inspector", overview: "A modal that shows the detailed backend pipeline execution for a specific message.", status: "✅ Completed" },
    { name: "UI: Proactive Suggestions", overview: "The AI suggests the next logical step or question after providing a response.", status: "✅ Completed" },
    { name: "UI: Universal Progress Indicator", overview: "A non-intrusive, top-of-page loading bar for background memory tasks.", status: "✅ Completed" },
    { name: "UI: Slash Commands in Chat", overview: "Ability to trigger agent runs and workflows directly from the chat input using '/' commands.", status: "✅ Completed" },

    // UI: Global & UX
    { name: "UX: Global Keyboard Shortcuts", overview: "A comprehensive set of keyboard shortcuts for power users.", status: "✅ Completed" },
    { name: "UX: Right-Click Context Menu", overview: "A global context menu for quick access to all major application functions.", status: "✅ Completed" },
    { name: "UX: Notification System", overview: "A system for displaying success, error, and info notifications.", status: "✅ Completed" },
    { name: "UX: Persistent UI Settings", overview: "User-specific UI settings (e.g., font size, theme) are saved to the database.", status: "✅ Completed" },
    { name: "UX: Theming Engine", overview: "Allows switching between Dark, Light, and Solarized themes.", status: "✅ Completed" },

    // Planned Features
    { name: "Agent: True ReAct Loop", overview: "Upgrade the autonomous agent from executing a fixed plan to a true ReAct loop where it can dynamically choose tools based on observations.", status: "⚪ Planned" },
    { name: "UI: Command Palette (Cmd+K)", overview: "A global 'Cmd+K' interface to quickly search for and execute any action in the app.", status: "⚪ Planned" },
    { name: "UI: Global Search", overview: "A single search bar that searches across everything: conversations, messages, contacts, and memory.", status: "⚪ Planned" },
];

async function seedFeatures() {
    console.log("Seeding features dictionary...");
    try {
        // Clear existing features to ensure a clean slate
        await sql`TRUNCATE TABLE features RESTART IDENTITY;`;
        console.log("Cleared existing features.");

        for (const feature of features) {
            await sql`
                INSERT INTO features (name, overview, status, "lastUpdatedAt")
                VALUES (${feature.name}, ${feature.overview}, ${feature.status}, CURRENT_TIMESTAMP);
            `;
        }
        console.log(`Successfully seeded ${features.length} features.`);
    } catch (error) {
        console.error("Error seeding features table:", error);
        process.exit(1);
    }
}

seedFeatures();
