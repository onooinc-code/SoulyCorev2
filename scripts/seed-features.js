// scripts/seed-features.js
const { sql } = require('@vercel/postgres');

const features = [
    // Core Cognitive Engine
    {
        name: "Core: Context Assembly Pipeline",
        overview: "The 'Read Path' that gathers context from all memory modules (episodic, semantic, structured) before calling the LLM to generate a response.",
        status: "✅ Completed",
        category: "Core Engine",
        ui_ux_breakdown_json: JSON.stringify([], null, 2),
        logic_flow: "Triggered by the /api/chat endpoint. It queries recent messages, searches for relevant knowledge in Pinecone, formats mentioned contacts, assembles these into a final system prompt, and then calls the LLM provider. Logs its execution to the pipeline_runs table.",
        key_files_json: JSON.stringify([
            "core/pipelines/context_assembly.ts",
            "app/api/chat/route.ts",
            "core/memory/modules/episodic.ts",
            "core/memory/modules/semantic.ts"
        ], null, 2),
        notes: "The logic for pruning context to fit token limits is still basic and could be improved."
    },
    {
        name: "Core: Memory Extraction Pipeline",
        overview: "The 'Write Path' that analyzes conversations asynchronously to extract and store entities and knowledge into long-term memory.",
        status: "✅ Completed",
        category: "Core Engine",
        ui_ux_breakdown_json: JSON.stringify([], null, 2),
        logic_flow: "Triggered by the /api/memory/pipeline endpoint after a chat turn. It uses an LLM call with a JSON schema to extract entities and factual knowledge chunks from the conversation text. It then calls the .store() methods of the Structured and Semantic memory modules to persist the new information.",
        key_files_json: JSON.stringify([
            "core/pipelines/memory_extraction.ts",
            "app/api/memory/pipeline/route.ts",
            "core/memory/modules/structured.ts",
            "core/memory/modules/semantic.ts"
        ], null, 2),
        notes: "Currently runs on every turn. A future improvement would be to run it only when the conversation is idle or based on a complexity threshold."
    },
    {
        name: "Core: Autonomous Agent Engine",
        overview: "The engine that takes a high-level goal, generates a plan, and executes it step-by-step using a Reason-Act loop.",
        status: "✅ Completed",
        category: "Agent System",
        ui_ux_breakdown_json: JSON.stringify([], null, 2),
        logic_flow: "The AutonomousAgent class is instantiated with a run ID, goal, and plan. The .run() method iterates through each phase, executing a loop of 'think -> act -> observe'. The 'think' step involves an LLM call to decide the next action based on the goal and last observation. The 'act' step calls the tool dispatcher. State is persisted to the agent_runs, agent_run_phases, and agent_run_steps tables throughout the process.",
        key_files_json: JSON.stringify([
            "core/agents/autonomous_agent.ts",
            "core/tools/index.ts",
            "app/api/agents/runs/route.ts"
        ], null, 2),
        notes: "The current implementation executes a pre-defined plan. The next evolution is a true ReAct loop where the agent chooses the tool dynamically in each step."
    },
    {
        name: "Core: Experience Consolidation",
        overview: "A background pipeline that learns from successful agent runs to create reusable, generalized 'experiences' (abstract plans).",
        status: "✅ Completed",
        category: "Agent System",
        ui_ux_breakdown_json: JSON.stringify([], null, 2),
        logic_flow: "Triggered after a successful agent run. It fetches the run's goal and steps, then uses an LLM call to generate a generalized 'goal_template', 'trigger_keywords', and an abstract plan. This new 'experience' is then saved to the 'experiences' table.",
        key_files_json: JSON.stringify([
            "core/pipelines/experience_consolidation.ts",
            "scripts/create-tables.js"
        ], null, 2)
    },

    // UI: Main Hubs & Centers
    { name: "UI: Dashboard Center", category: "UI/UX Hubs", overview: "The main landing page providing a high-level overview of the entire system, including strategic goals and subsystem health.", status: "✅ Completed", key_files_json: JSON.stringify(["components/dashboard/DashboardCenter.tsx"]), logic_flow: "Fetches data from multiple dashboard-specific API endpoints (/api/dashboard/...) to populate various panels with real-time stats, goals, and system health information." },
    { name: "UI: Agent Center", category: "UI/UX Hubs", overview: "A hub for launching, monitoring, and reviewing autonomous agent runs.", status: "✅ Completed", key_files_json: JSON.stringify(["components/agent_center/AgentCenter.tsx"]), logic_flow: "Allows users to define a goal, which calls the /api/agents/plan endpoint. After reviewing the plan, the user can start the run via /api/agents/runs. The UI then polls the run's status and displays the live report." },
    { name: "UI: Brain Center", category: "UI/UX Hubs", overview: "A hub for managing Brain configurations and inspecting raw memory module data.", status: "✅ Completed", key_files_json: JSON.stringify(["components/brain_center/BrainCenter.tsx"]), logic_flow: "Provides a CRUD interface for the 'brains' table via /api/brains endpoints. The Memory Viewer tab makes GET requests to the /api/memory-viewer/[module] endpoint to inspect data." },
    { name: "UI: Memory Center", category: "UI/UX Hubs", overview: "The hub for managing structured memory, including Entities, Relationships, and Segments.", status: "✅ Completed", key_files_json: JSON.stringify(["components/MemoryCenter.tsx"]), logic_flow: "Contains tabs for different structured memory types. Each tab (e.g., EntityHub) provides a full CRUD interface for its respective data model via dedicated API endpoints (/api/entities, /api/segments, etc.)." },
    { name: "UI: Contacts Hub", category: "UI/UX Hubs", overview: "A dedicated UI for managing personal and professional contacts.", status: "✅ Completed", key_files_json: JSON.stringify(["components/ContactsHub.tsx"]), logic_flow: "Provides a full CRUD interface for the 'contacts' table via the /api/contacts API endpoints." },
    { name: "UI: Prompts Hub", category: "UI/UX Hubs", overview: "A system for creating, managing, and using reusable prompt templates and multi-step workflows.", status: "✅ Completed", key_files_json: JSON.stringify(["components/PromptsHub.tsx"]), logic_flow: "Provides a CRUD interface for the 'prompts' table. The Workflow Builder UI constructs a JSON 'chain_definition' which is saved with the prompt." },
    { name: "UI: Tools Hub", category: "UI/UX Hubs", overview: "An interface for managing the agent's capabilities (tools) and their schemas.", status: "✅ Completed", key_files_json: JSON.stringify(["components/ToolsHub.tsx"]), logic_flow: "Provides a full CRUD interface for the 'tools' table via the /api/tools API endpoints. Requires a valid Gemini FunctionDeclaration schema for each tool." },
    { name: "UI: Projects Hub", category: "UI/UX Hubs", overview: "A hub for managing projects and their associated tasks, including AI-powered summaries.", status: "✅ Completed", key_files_json: JSON.stringify(["components/ProjectsHub.tsx"]), logic_flow: "Provides a full CRUD interface for 'projects' and 'project_tasks' tables via dedicated API endpoints." },
    { name: "UI: Experiences Hub", category: "UI/UX Hubs", overview: "A UI to view and manage the generalized plans learned from successful agent runs.", status: "✅ Completed", key_files_json: JSON.stringify(["components/hubs/ExperiencesHub.tsx"]), logic_flow: "Fetches and displays data from the 'experiences' table via the /api/experiences endpoint." },
    { name: "UI: Data Hub", category: "UI/UX Hubs", overview: "A dashboard for monitoring and managing all connected data sources and storage services.", status: "✅ Completed", key_files_json: JSON.stringify(["components/data_hub/DataHubCenter.tsx"]), logic_flow: "Fetches and displays data from the 'data_sources' table. Provides modals for updating connection settings." },
    { name: "UI: Communication Hub", category: "UI/UX Hubs", overview: "A hub for managing inbound (webhooks) and outbound (notifications) communication channels.", status: "✅ Completed", key_files_json: JSON.stringify(["components/hubs/CommunicationHub.tsx"]), logic_flow: "Provides a CRUD interface for the 'comm_channels' table. The Unified Inbox reads from the 'logs' table for webhook events." },
    { name: "UI: SoulyDev Center", category: "Dev Center", overview: "An integrated developer control panel with API testing, feature health dashboards, and documentation.", status: "✅ Completed", key_files_json: JSON.stringify(["components/dev_center/DevCenter.tsx"]), logic_flow: "A multi-tab hub that fetches data from 'api_endpoints', 'features', 'feature_tests', and 'documentations' tables to provide its functionality." },

    // UI: Chat & Conversation
    { name: "UI: Chat Interface", category: "Chat", overview: "The main conversational UI for interacting with the agent, displaying messages, and managing chat state.", status: "✅ Completed", key_files_json: JSON.stringify(["components/ChatWindow.tsx", "components/chat/MessageList.tsx"]), logic_flow: "The ChatWindow component orchestrates the Header, MessageList, StatusBar, and ChatFooter. It fetches and displays messages from the ConversationProvider." },
    { name: "UI: Message Toolbar", category: "Chat", overview: "A hover-toolbar on messages for actions like copy, bookmark, summarize, edit, regenerate, and inspect.", status: "✅ Completed", key_files_json: JSON.stringify(["components/MessageToolbar.tsx"]), logic_flow: "Appears on mouse hover over a message. Each button calls a corresponding handler function passed down from ChatWindow." },
    { name: "UI: Cognitive Inspector", category: "Chat", overview: "A modal that shows the detailed backend pipeline execution log for a specific AI-generated message.", status: "✅ Completed", key_files_json: JSON.stringify(["components/CognitiveInspectorModal.tsx", "app/api/inspect/[messageId]/route.ts"]), logic_flow: "When opened, it calls the /api/inspect/[messageId] endpoint, which fetches the corresponding records from the 'pipeline_runs' and 'pipeline_run_steps' tables and displays them." },
    { name: "UI: Proactive Suggestions", category: "Chat", overview: "The AI suggests the next logical step or question after providing a response.", status: "✅ Completed", key_files_json: JSON.stringify(["components/chat/ChatFooter.tsx", "lib/gemini-server.ts"]), logic_flow: "After the main AI response is generated, the /api/chat route makes a secondary, specialized LLM call to generate a concise suggestion based on the last two turns of conversation." },
    { name: "UI: Slash Commands", category: "Chat", overview: "Ability to trigger agent runs ('/agent') and workflows ('/workflow') directly from the chat input.", status: "✅ Completed", key_files_json: JSON.stringify(["components/ChatInput.tsx"]), logic_flow: "The ChatInput component checks if the input starts with a '/'. If it matches a command, it calls the appropriate function from the ConversationProvider (e.g., startAgentRun) instead of the standard addMessage flow." },
    { name: "UI: Message Threading/Replies", category: "Chat", overview: "Reply directly to a specific message, creating a nested visual thread to keep discussions organized.", status: "✅ Completed", key_files_json: JSON.stringify(["components/Message.tsx", "components/MessageFooter.tsx"]), logic_flow: "When a reply is sent, the parent message's ID is stored in the 'parent_message_id' column. The frontend uses this to display a visual indicator and link." },
    
    // Global UI/UX
    {
        name: "UX: Command Palette (Cmd+K)",
        overview: "A global 'Cmd+K' interface to quickly search for and execute any action in the app, such as navigating to hubs or creating new conversations.",
        status: "✅ Completed",
        category: "Global UI/UX",
        ui_ux_breakdown_json: JSON.stringify([
            { "subFeature": "Activation", "description": "Opens on 'Cmd/Ctrl + K' keyboard shortcut.", "status": "✅ Completed" },
            { "subFeature": "Search Input", "description": "Real-time filtering of actions as the user types.", "status": "✅ Completed" },
            { "subFeature": "Grouped Results", "description": "Actions are grouped by section (e.g., Navigation, Conversation).", "status": "✅ Completed" },
            { "subFeature": "Keyboard Navigation", "description": "Full navigation with Arrow keys, Enter to execute, and Escape to close.", "status": "✅ Completed" }
        ], null, 2),
        logic_flow: "The component fetches a static list of available actions from 'lib/actionsRegistry.ts'. User input filters this list. When an action is selected, a handler ID is used to call the corresponding function from the UI or Conversation context providers, which then executes the action.",
        key_files_json: JSON.stringify([
            "components/CommandPalette.tsx",
            "lib/actionsRegistry.ts",
            "lib/hooks/use-keyboard-shortcuts.ts",
            "components/providers/UIStateProvider.tsx"
        ], null, 2),
        notes: "The action registry is currently static. A future improvement could be to make it dynamic, allowing hubs or components to register their own actions."
    },
    {
        name: "UX: Global Search",
        overview: "A dedicated hub that searches across everything: conversations, messages, and contacts.",
        status: "✅ Completed",
        category: "Global UI/UX",
        ui_ux_breakdown_json: JSON.stringify([
            { "subFeature": "Search Bar", "description": "A large input for typing search queries with debouncing.", "status": "✅ Completed" },
            { "subFeature": "Results List", "description": "Displays a unified list of results from different data models.", "status": "✅ Completed" },
            { "subFeature": "Result Clicking", "description": "Clicking a result navigates to the appropriate context (opens a conversation, jumps to a message, etc.).", "status": "✅ Completed" }
        ], null, 2),
        logic_flow: "The GlobalSearch component sends a debounced request to the `/api/search` endpoint. The backend queries the 'conversations', 'messages', and 'contacts' tables with an ILIKE clause and returns a unified list of SearchResult objects.",
        key_files_json: JSON.stringify([
            "components/search/GlobalSearch.tsx",
            "app/api/search/route.ts"
        ], null, 2)
    },
    { name: "UX: Global Keyboard Shortcuts", category: "Global UI/UX", overview: "A comprehensive set of keyboard shortcuts for power users, managed by a custom hook.", status: "✅ Completed", key_files_json: JSON.stringify(["lib/hooks/use-keyboard-shortcuts.ts", "components/App.tsx"]) },
    { name: "UX: Right-Click Context Menu", category: "Global UI/UX", overview: "A global context menu for quick access to all major application functions.", status: "✅ Completed", key_files_json: JSON.stringify(["components/ContextMenu.tsx", "lib/hooks/useAppContextMenu.ts"]) },
    { name: "UX: Notification System", category: "Global UI/UX", overview: "A system for displaying success, error, and info toast notifications.", status: "✅ Completed", key_files_json: JSON.stringify(["components/Notifications.tsx", "components/providers/NotificationProvider.tsx"]) },
    { name: "UX: Persistent UI Settings", category: "Global UI/UX", overview: "User-specific UI settings (e.g., font size, theme) are fetched from and saved to the database.", status: "✅ Completed", key_files_json: JSON.stringify(["components/providers/SettingsProvider.tsx", "app/api/settings/route.ts"]) },
    { name: "UX: Theming Engine", category: "Global UI/UX", overview: "Allows switching between Dark, Light, and Solarized themes via CSS variables.", status: "✅ Completed", key_files_json: JSON.stringify(["app/globals.css", "components/providers/SettingsProvider.tsx"]) },
    { name: "UX: Versioning System", category: "Global UI/UX", overview: "Displays the current app version in the header with a hover card for recent changes and a modal for the full history.", status: "✅ Completed", key_files_json: JSON.stringify(["components/Header.tsx", "components/VersionLogModal.tsx", "app/api/version/current/route.ts"]) },
    { name: "UX: Morning Briefing", category: "Global UI/UX", overview: "A welcome-back modal that appears once per day, summarizing the user's last session.", status: "✅ Completed", key_files_json: JSON.stringify(["components/MorningBriefing.tsx"]) },

    // Planned Features
    {
        name: "Agent: True ReAct Loop",
        overview: "Upgrade the autonomous agent from executing a fixed plan to a true ReAct loop where it can dynamically choose tools based on observations.",
        status: "⚪ Planned",
        category: "Agent System",
        ui_ux_breakdown_json: "[]",
        logic_flow: "The agent's 'think' step would be enhanced to not just decide on the next action for a pre-defined phase, but to choose any available tool from the Tool Hub that best serves the main goal. This requires a more complex orchestrator prompt and error handling logic.",
        key_files_json: JSON.stringify([
            "core/agents/autonomous_agent.ts",
            "core/tools/index.ts"
        ], null, 2),
        notes: "This is the next major evolution for the agent system."
    },
    {
        name: "UI: Visual Relationship Graph",
        overview: "A visual, interactive graph to display the relationships between entities stored in structured memory.",
        status: "⚪ Planned",
        category: "Memory",
        ui_ux_breakdown_json: JSON.stringify([
            { "subFeature": "Node Rendering", "description": "Display each entity as a node.", "status": "⚪ Planned" },
            { "subFeature": "Edge Rendering", "description": "Display relationships as labeled, directed edges.", "status": "⚪ Planned" },
            { "subFeature": "Interactivity", "description": "Allow users to drag nodes, zoom, and pan the graph.", "status": "⚪ Planned" }
        ], null, 2),
        logic_flow: "The component will fetch data from `/api/entities/relationships` and use a library like D3.js or react-flow to render the nodes and edges.",
        key_files_json: JSON.stringify([
            "components/hubs/RelationshipGraph.tsx"
        ], null, 2),
        notes: "Currently, this component only displays the raw JSON data."
    },
    {
        name: "Input: File Uploads",
        overview: "Allow users to upload files (PDF, TXT, images) to be included in the conversation context.",
        status: "⚪ Planned",
        category: "Chat",
        ui_ux_breakdown_json: "[]",
        logic_flow: "The frontend would upload the file to Vercel Blob via '/api/files/upload'. The file URL would then be passed to the backend, which would fetch and parse the content before including it in the context for an LLM call.",
        key_files_json: JSON.stringify([
            "components/ChatInput.tsx",
            "app/api/files/upload/route.ts"
        ], null, 2),
        notes: "The 'Paperclip' button in the chat input is currently disabled."
    }
];

async function seedFeatures() {
    console.log("Seeding features dictionary...");
    try {
        // Clear existing features to ensure a clean slate
        // FIX: Added CASCADE to the TRUNCATE command. This is necessary because the `feature_tests` table
        // has a foreign key constraint that references the `features` table. TRUNCATE...CASCADE will
        // automatically truncate both `features` and any tables that depend on it, resolving the
        // foreign key violation error during the database seeding process.
        await sql`TRUNCATE TABLE "features" RESTART IDENTITY CASCADE;`;
        console.log("Cleared existing features and related test data.");

        for (const feature of features) {
            await sql`
                INSERT INTO "features" (
                    "name", 
                    "overview", 
                    "status", 
                    "category",
                    "uiUxBreakdownJson",
                    "logicFlow",
                    "keyFilesJson",
                    "notes",
                    "lastUpdatedAt"
                )
                VALUES (
                    ${feature.name}, 
                    ${feature.overview || null}, 
                    ${feature.status}, 
                    ${feature.category || null},
                    ${feature.ui_ux_breakdown_json || null},
                    ${feature.logic_flow || null},
                    ${feature.key_files_json || null},
                    ${feature.notes || null},
                    CURRENT_TIMESTAMP
                );
            `;
        }
        console.log(`Successfully seeded ${features.length} features.`);
    } catch (error) {
        console.error("Error seeding features table:", error);
        process.exit(1);
    }
}

seedFeatures();