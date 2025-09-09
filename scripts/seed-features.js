// scripts/seed-features.js
require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const { execSync } = require('child_process');

const featuresData = [
    {
        name: 'Conversation & Chat UI',
        overview: 'The primary user interface for interacting with the AI, displaying messages, and managing conversation context.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Chat Window & Message Display', description: 'Main scrollable view for conversation history.', status: '✅ Completed' },
            { subFeature: 'Message Bubbles', description: 'Distinct styling for user vs. model messages.', status: '✅ Completed' },
            { subFeature: 'Markdown & GFM Rendering', description: 'Renders rich text, code blocks, and tables in AI responses.', status: '✅ Completed' },
            { subFeature: 'Chat Input', description: 'Text area for user input, including @mentions and image uploads.', status: '✅ Completed' },
            { subFeature: 'Message Toolbar', description: 'Hover controls on messages for actions like Copy, Bookmark, Summarize.', status: '✅ Completed' },
            { subFeature: 'Conversation List Sidebar', description: 'Allows switching between and creating new conversations.', status: '✅ Completed' },
            { subFeature: 'Enhanced Sidebar Navigation', description: 'Add visual cues for unread messages or conversation status', status: '✅ Completed' },
            { subFeature: 'Informative Tooltips', description: 'All interactive buttons and icons have detailed tooltips on hover.', status: '✅ Completed' }
        ]),
        logic_flow: 'User sends a message via ChatInput -> AppProvider optimistically updates the UI -> An API call is made to /api/chat with the message history and context -> The API route constructs the full prompt, including memory and contact info -> A call is made to the Gemini API -> The response is received and sent back to the client -> The UI is updated with the final AI message -> A background, fire-and-forget call is made to /api/memory/pipeline to learn from the exchange.',
        key_files_json: JSON.stringify([
            'components/ChatWindow.tsx',
            'components/ChatInput.tsx',
            'components/Message.tsx',
            'app/api/chat/route.ts',
            'components/providers/AppProvider.tsx'
        ]),
        notes: 'The file upload UI is functional but could be enhanced with drag-and-drop support and previews for more file types.'
    },
    {
        name: 'Right-Click Context Menu',
        overview: 'A global, context-aware right-click menu that provides quick access to over 20 of the most common and useful application functions, reducing clicks and improving user workflow efficiency.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Menu Activation & Positioning', description: 'Right-clicking anywhere in the app opens the menu at the cursor\'s position.', status: '✅ Completed' },
            { subFeature: 'Dynamic Menu Items', description: 'Menu items are context-aware; some are disabled if no conversation is active.', status: '✅ Completed' },
            { subFeature: 'Logical Grouping', description: 'Actions are grouped into logical sections like Application, Conversation, Memory, and Quick Access.', status: '✅ Completed' },
            { subFeature: 'Modal Triggers', description: 'Actions can trigger modals, such as "Add Knowledge Snippet" or "Keyboard Shortcuts".', status: '✅ Completed' }
        ]),
        logic_flow: 'The main App component has a top-level `onContextMenu` event handler. This handler prevents the default browser menu and sets the state for the custom ContextMenu component, including its open status and X/Y position. The menu items are defined as an array of objects in App.tsx, with each object containing a label, icon, action function, and a disabled condition. The ContextMenu component handles its own dismissal logic (on Escape key or outside click).',
        key_files_json: JSON.stringify([
            'components/App.tsx',
            'components/ContextMenu.tsx',
            'components/Icons.tsx',
            'components/AddKnowledgeModal.tsx',
            'components/ShortcutsModal.tsx'
        ]),
        notes: 'The context menu could be made even more specific in the future, for example, by showing different options when right-clicking on a specific message versus an empty area.'
    },
    {
        name: 'Multi-Layered Memory System',
        overview: 'The core system that gives SoulyCore its persistence. It combines a structured SQL database for entities and a vector database for semantic knowledge, processed automatically after conversations.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Memory Center UI', description: 'A modal for viewing and managing structured entities.', status: '✅ Completed' },
            { subFeature: 'Memory Toggles in Agent Config', description: 'Per-conversation switches to enable/disable semantic and structured memory.', status: '✅ Completed' },
            { subFeature: 'Automatic Memory Pipeline', description: 'A background process with no direct UI that analyzes conversations and updates memory stores.', status: '✅ Completed' }
        ]),
        logic_flow: 'After a successful chat exchange, the client sends the user query and AI response to /api/memory/pipeline. This endpoint uses Gemini to perform extraction, identifying key entities and knowledge chunks. Entities are upserted into the Vercel Postgres `entities` table. Knowledge chunks are embedded (simulated) and upserted into the Pinecone vector index for future semantic retrieval.',
        key_files_json: JSON.stringify([
            'app/api/memory/pipeline/route.ts',
            'lib/gemini-server.ts',
            'lib/pinecone.ts',
            'components/MemoryCenter.tsx',
            'scripts/create-tables.js'
        ]),
        notes: 'The knowledge chunking and deduplication logic is currently simple. It could be improved with more sophisticated text-splitting algorithms to enhance the quality of semantic search results.'
    },
    {
        name: 'Contacts Hub & @Mentions',
        overview: 'A full CRUD interface for managing contacts. These contacts can be mentioned in chat to provide the AI with specific context about individuals, which is injected into the prompt.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Contacts Hub Modal', description: 'The main interface for viewing and managing all contacts.', status: '✅ Completed' },
            { subFeature: 'Contact Form', description: 'A form within the hub for creating and updating contact details.', status: '✅ Completed' },
            { subFeature: 'Searchable & Sortable Table', description: 'The contact list can be searched and sorted by various fields.', status: '✅ Completed' },
            { subFeature: '@mention Autocomplete', description: 'A popup in the chat input that suggests contacts when the user types "@".', status: '✅ Completed' }
        ]),
        logic_flow: 'The user types "@" in ChatInput, which fetches contacts from /api/contacts and displays a filtered list. When a message containing an @mention is sent, the AppProvider includes the mentioned contacts in the payload to /api/chat. The API route then formats the contact data and prepends it to the prompt as context for the Gemini model.',
        key_files_json: JSON.stringify([
            'components/ContactsHub.tsx',
            'components/ChatInput.tsx',
            'app/api/contacts/[...].ts',
            'app/api/chat/route.ts'
        ]),
        notes: 'Future enhancements could include contact groups, linking contacts to entities, or importing contacts from external sources.'
    },
    {
        name: 'Proactive AI Suggestions',
        overview: 'After a conversation turn, the AI analyzes the context and suggests a relevant next step or action to the user, displayed in a non-intrusive UI element.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Suggestion Bar', description: 'A small bar that appears above the chat input with the suggested action.', status: '✅ Completed' },
            { subFeature: 'Action Buttons', description: 'Simple "Yes" and "Dismiss" buttons to act on or ignore the suggestion.', status: '✅ Completed' }
        ]),
        logic_flow: 'The /api/chat endpoint, after receiving a valid response from the main Gemini call, makes a second, non-blocking call to the `generateProactiveSuggestion` function in `gemini-server.ts`. This function uses a specific prompt to ask the model for a next-step suggestion. The resulting string is sent back to the client, which then renders the suggestion bar UI.',
        key_files_json: JSON.stringify([
            'app/api/chat/route.ts',
            'lib/gemini-server.ts',
            'components/ChatWindow.tsx'
        ]),
        notes: 'The suggestion logic is currently broad. This could be evolved into a more structured tool-use or function-calling system for more complex and reliable actions.'
    },
    {
        name: 'Prompts Hub & Dynamic Workflows',
        overview: 'A comprehensive system for creating, managing, and using reusable prompt templates. It supports advanced organization, dynamic variables, and multi-step prompt chaining to create powerful workflows.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Prompts Hub UI', description: 'A two-panel CRUD interface for managing all saved prompts.', status: '✅ Completed' },
            { subFeature: 'Filter Sidebar', description: 'A dedicated panel within the hub to filter prompts by folder or tag.', status: '✅ Completed' },
            { subFeature: 'Prompt Form with Type Selector', description: 'Form for creating/editing prompts, allowing selection between "Single" and "Workflow" types.', status: '✅ Completed' },
            { subFeature: 'Chat Input Launcher', description: 'Quick-access, searchable popup list of prompts available directly in the chat input.', status: '✅ Completed' },
            { subFeature: 'Dynamic Variable Modal', description: 'A modal that appears when selecting a prompt with {{variable}} placeholders, allowing the user to fill them in before use.', status: '✅ Completed' },
            { subFeature: 'Workflow Builder UI', description: 'A drag-and-drop interface for ordering steps in a chained prompt and mapping inputs/outputs.', status: '✅ Completed' }
        ]),
        logic_flow: 'Management: User interacts with PromptsHub UI, triggering API calls to `/api/prompts/[...].ts` which perform CRUD operations. Usage: User clicks the launcher in `ChatInput.tsx`. On selecting a "Single" prompt, it checks for variables and may show the `FillPromptVariablesModal`. On selecting a "Workflow" prompt, it triggers the `startWorkflow` function in `AppProvider`, which then executes the chain step-by-step.',
        key_files_json: JSON.stringify([
            'components/PromptsHub.tsx',
            'components/ChatInput.tsx',
            'components/FillPromptVariablesModal.tsx',
            'app/api/prompts/[...].ts',
            'components/providers/AppProvider.tsx'
        ]),
        notes: 'The workflow builder is functional but could be enhanced with more complex logic like conditional steps in the future.'
    },
    {
        name: 'SoulyDev Center',
        overview: 'An integrated control panel for developers to monitor, manage, and extend the application\'s functionality. It centralizes project documentation, feature management, and other developer tools.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Tabbed Interface', status: '✅ Completed', description: 'Allows navigation between different developer-focused sections.' },
            { subFeature: 'Features Dictionary', status: '✅ Completed', description: 'A full CRUD interface for managing this very feature list.' },
            { subFeature: 'Feature Health Dashboard', status: '✅ Completed', description: 'A QA hub to display the health status of all system features based on registered test cases.' },
            { subFeature: 'API Command Center', status: '✅ Completed', description: 'A Postman-like interface to test all backend API endpoints directly in the app.' },
            { subFeature: 'Smart Documentation', status: '✅ Completed', description: 'A live, editable viewer for all project documentation markdown files.' },
            { subFeature: 'Dashboard Center', status: '✅ Completed', description: 'A high-level overview of the project, displaying key metrics and statistics.' },
            { subFeature: 'Roadmap & Ideas', status: '🔴 Needs Refactor', description: 'A placeholder for an AI-powered idea generation and planning tool that needs to be implemented.' }
        ]),
        logic_flow: 'A primary modal component that dynamically loads different sub-components based on the active tab state. It is fully implemented with GET, POST, PUT, and DELETE functionality via various API routes, interacting directly with the Vercel Postgres database.',
        key_files_json: JSON.stringify([
            'components/dev_center/DevCenter.tsx',
            'components/dev_center/FeaturesDictionary.tsx',
            'components/dev_center/FeatureHealthDashboard.tsx',
            'components/dev_center/api_command_center/APICommandCenterTab.tsx',
            'app/api/features/[...].ts'
        ]),
        notes: 'The "Roadmap & Ideas" tab needs to be implemented with real functionality and API integrations to be useful.'
    },
     {
        name: 'Dashboard Center',
        overview: 'A high-level command center for the entire application, providing at-a-glance views of system statistics, strategic goals, and live project documentation. It serves as the main entry point and overview for the user.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'System Stats Panel', description: 'Displays key metrics like conversation count, memory size, and pipeline performance using dynamic charts.', status: '✅ Completed' },
            { subFeature: 'Live Hedra Goals Panel', description: 'Fetches and displays the project\'s core strategic goals from the database, allowing for in-place editing.', status: '✅ Completed' },
            { subFeature: 'Live Documentation Panel', description: 'Shows an index of key project documents, which can be viewed and edited in a modal without leaving the app.', status: '✅ Completed' },
            { subFeature: 'Action/Decision/Report Panels', description: 'Placeholder panels for future system-wide actions, pending user decisions, and generated reports.', status: '✅ Completed' }
        ]),
        logic_flow: 'The DashboardCenter.tsx component orchestrates multiple sub-panels. Each panel (e.g., StatsPanel.tsx) fetches its data from a dedicated API endpoint (e.g., /api/dashboard/stats). The HedraGoalsPanel and DocumentationPanel use PUT requests to save user edits back to the database, creating a live, interactive experience.',
        key_files_json: JSON.stringify([
            'components/dashboard/DashboardCenter.tsx',
            'components/dashboard/DashboardPanel.tsx',
            'components/dashboard/StatsPanel.tsx',
            'components/dashboard/HedraGoalsPanel.tsx',
            'app/api/dashboard/stats/route.ts',
            'app/api/hedra-goals/route.ts'
        ]),
        notes: 'The dashboard is designed to be the default view, providing immediate value and context upon opening the application.'
    },
    {
        name: 'Autonomous Agent Center',
        overview: 'A dedicated hub for defining high-level goals and launching autonomous agents to achieve them. It provides real-time monitoring of the agent\'s thought process and a history of all previous runs.',
        status: '✅ Completed',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Goal Definition UI', description: 'A simple textarea for the user to input a complex, multi-step goal for the agent.', status: '✅ Completed' },
            { subFeature: 'Run History List', description: 'A list of all previous and ongoing agent runs, showing their status and final result.', status: '✅ Completed' },
            { subFeature: 'Live Execution Report', description: 'A detailed, step-by-step view of a selected run, showing the agent\'s "Thought", "Action", and "Observation" for each step in the ReAct loop.', status: '✅ Completed' }
        ]),
        logic_flow: 'The user submits a goal via AgentCenter.tsx, which sends a POST request to /api/agents/runs. The backend API route initiates a long-running ReAct (Reason + Act) loop, saving each step to the database. The frontend\'s RunReport.tsx component polls the API or uses a future websocket connection to display the steps in real-time as they are completed.',
        key_files_json: JSON.stringify([
            'components/agent_center/AgentCenter.tsx',
            'components/agent_center/RunReport.tsx',
            'app/api/agents/runs/route.ts',
            'app/api/agents/runs/[runId]/route.ts',
            'scripts/create-tables.js'
        ]),
        notes: 'Currently uses a simple prompt-based tool. The architecture is designed to easily incorporate more complex, function-calling tools in the future.'
    }
];

const cognitiveFeaturesData = [
    { name: 'V2 [Core] - Core Services Layer Scaffolding', overview: 'Establish the new `core/` directory and its subdirectories (`llm`, `memory`, `pipelines`) to house all new, decoupled business logic for the Cognitive Engine.', status: '✅ Completed' },
    { name: 'V2 [Core] - "Brain" Configuration Management', overview: 'A foundational system to define and manage Agent "Brains," including the mapping of Brains to specific memory module namespaces for data isolation.', status: '✅ Completed' },
    { name: 'V2 [Core] - Single Memory Module (SMM) Interfaces', overview: 'Define standardized TypeScript interfaces for each memory type (Episodic, Semantic, etc.) to ensure a consistent API for the Core Engine to interact with.', status: '✅ Completed' },
    { name: 'V2 [Core] - LLM Provider Abstraction Layer', overview: 'Implement an adapter pattern to decouple the system from any specific AI provider SDK, starting with a `GeminiProvider` implementation.', status: '✅ Completed' },
    { name: 'V2 [Core] - Episodic Memory Module', overview: 'Refactored logic to manage the storage and retrieval of conversation history from Vercel Postgres, implementing the new SMM interface.', status: '✅ Completed' },
    { name: 'V2 [Core] - Semantic Memory Module', overview: 'Refactored logic for all interactions with the Pinecone vector database, including embedding generation and similarity search, implementing the SMM interface.', status: '✅ Completed' },
    { name: 'V2 [Core] - Structured Memory Module', overview: 'Refactored logic for managing structured data (entities, contacts) in Vercel Postgres, implementing the SMM interface.', status: '✅ Completed' },
    { name: 'V2 [Core] - Working Memory Module', overview: 'A new module utilizing Vercel KV (Redis) for high-speed, temporary storage of in-flight data, such as the assembled context for a single API call.', status: '✅ Completed' },
    { name: 'V2 [Core] - Context Assembly Pipeline', overview: 'The "Read Path" orchestrator that intelligently queries all relevant SMMs to build a compact, optimized context for the LLM on each conversational turn.', status: '✅ Completed' },
    { name: 'V2 [Core] - Memory Extraction Pipeline', overview: 'The "Write Path" orchestrator that runs post-conversation to analyze the exchange, extract knowledge, and commit it to the appropriate long-term SMMs.', status: '✅ Completed' },
    { name: 'V2 [API] - Refactor `/api/chat` Endpoint', overview: 'Rewrite the primary chat endpoint to delegate all business logic to the new Context Assembly Pipeline in the Core Engine.', status: '✅ Completed' },
    { name: 'V2 [API] - Refactor `/api/memory/pipeline` Endpoint', overview: 'Rewrite the memory processing endpoint to delegate all logic to the new Memory Extraction Pipeline in the Core Engine.', status: '✅ Completed' },
    { name: 'V2 [API] - Brain Management Endpoints', overview: 'Create a new set of CRUD API endpoints to manage Brain configurations, allowing the UI to create, read, update, and delete them.', status: '✅ Completed' },
    { name: 'V2 [API] - Memory Viewer Endpoints', overview: 'Create new read-only API endpoints that allow the Brain Center UI to query and display the contents of each SMM for inspection and manual management.', status: '✅ Completed' },
    { name: 'V2 [UI] - The "Brain Center" Hub', overview: 'A new, top-level modal or dedicated view that will serve as the central management hub for all components of the Cognitive Architecture.', status: '✅ Completed' },
    { name: 'V2 [UI] - Brain Management Tab', overview: 'A UI panel within the Brain Center for creating, viewing, and configuring Agent Brains and their associated memory module namespaces.', status: '✅ Completed' },
    { name: 'V2 [UI] - Memory Module Viewer Tab', overview: 'A UI panel within the Brain Center that provides a direct view into each memory module, allowing for manual CRUD operations on stored data (e.g., deleting a specific memory).', status: '✅ Completed' },
    { name: 'V2 [UI] - Cognitive Inspector', overview: 'An "Inspect" button on messages that opens a modal showing a step-by-step breakdown of the backend cognitive pipeline (Context Assembly or Memory Extraction) that ran for that specific message turn. The data is pulled from a persistent log in the database.', status: '✅ Completed' },
    { name: 'V2 [UI] - Universal Progress Indicator', overview: 'A non-intrusive, system-wide progress indicator (e.g., a subtle top-loading bar) that visualizes all background memory operations.', status: '✅ Completed' },
    { name: 'V2 [UI] - Long Message Collapse Feature', overview: 'Implement an automatic, content-aware summarization and collapse feature for long messages in the chat view to solve the "wall of text" problem.', status: '✅ Completed' },
    { name: 'V2 [QA] - Test Case Registry Backend', overview: 'Create the `feature_tests` database table and the necessary API endpoints to manage test cases linked to features in the dictionary.', status: '✅ Completed' },
    { name: 'V2 [QA] - Feature Health Dashboard UI', overview: 'A new tab in the DevCenter to display the health status of all system features, based on the results from the Test Case Registry.', status: '✅ Completed' },
    { name: 'V2 [QA] - Manual Test Execution UI', overview: 'An interface within the Feature Health Dashboard that allows developers to manually execute registered test cases and record the results.', status: '✅ Completed' }
];

const newlyProposedFeaturesData = [
    {
        name: 'UI/UX: Command Palette',
        overview: 'A global "Cmd+K" interface to quickly search for and execute any action in the app. This dramatically speeds up navigation for power users.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Activation', description: 'Open with Cmd+K or Ctrl+K.', status: '⚪ Planned' },
            { subFeature: 'Fuzzy Search', description: 'Search for actions by name.', status: '⚪ Planned' },
            { subFeature: 'Action Execution', description: 'Execute actions directly from the palette.', status: '⚪ Planned' },
        ]),
        logic_flow: 'A global keydown listener (mod+k) opens a modal. A state manager holds search state. Fuzzy search filters a predefined list of actions. Selecting an action calls the corresponding function from AppContext.',
        key_files_json: JSON.stringify(['components/CommandPalette.tsx', 'lib/hooks/use-keyboard-shortcuts.ts', 'lib/actionsRegistry.ts']),
        notes: 'Needs a comprehensive registry of all possible actions in the application.'
    },
    {
        name: 'UI/UX: Theming Engine',
        overview: 'Allows the user to switch between different visual themes (e.g., Light, Dark, Solarized) and potentially customize primary colors.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Theme Switcher', description: 'A dropdown or button set to select a theme.', status: '⚪ Planned' },
            { subFeature: 'CSS Variables', description: 'Themes are implemented using CSS variables for easy switching.', status: '⚪ Planned' },
            { subFeature: 'Persistence', description: 'Selected theme is saved to localStorage.', status: '⚪ Planned' },
        ]),
        logic_flow: 'User selects a theme. A class (e.g., `theme-dark`) is applied to the `<html>` element. CSS variables defined in `globals.css` for each theme are then activated. The selected theme is saved to localStorage.',
        key_files_json: JSON.stringify(['app/globals.css', 'components/ThemeSwitcher.tsx', 'lib/hooks/useTheme.ts']),
        notes: ''
    },
     {
        name: 'UI/UX: Global Search',
        overview: 'A single search bar that searches across everything: conversation titles, message content, contacts, and semantic memory.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Search Interface', description: 'A dedicated search bar, possibly in the sidebar or command palette.', status: '⚪ Planned' },
            { subFeature: 'Unified Results', description: 'Display results from different sources in a single, categorized view.', status: '⚪ Planned' },
            { subFeature: 'API Endpoint', description: 'A new API endpoint `/api/search?q=` to handle the federated search logic.', status: '⚪ Planned' },
        ]),
        logic_flow: 'The UI calls `/api/search`. The backend API then queries the `conversations`, `messages`, `contacts`, and Pinecone (`semantic memory`) in parallel. Results are aggregated and returned to the client.',
        key_files_json: JSON.stringify(['components/GlobalSearch.tsx', 'app/api/search/route.ts']),
        notes: 'Performance is key; backend searches must be highly optimized.'
    },
    {
        name: 'UI/UX: Tabbed Hubs',
        overview: 'Instead of opening full-screen modals, hubs like Memory Center or Dev Center open as persistent tabs in the main interface.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Tab Bar UI', description: 'A new UI element to display and manage open tabs.', status: '⚪ Planned' },
            { subFeature: 'State Management', description: 'AppProvider will need to manage the state of open tabs.', status: '⚪ Planned' },
            { subFeature: 'Component Views', description: 'The main content area will render the component for the active tab.', status: '⚪ Planned' },
        ]),
        logic_flow: 'User clicks a hub icon. Instead of opening a modal, `AppProvider` adds a new tab to its state. The main layout component renders a tab bar and displays the content for the active tab.',
        key_files_json: JSON.stringify(['components/TabbedInterface.tsx', 'components/providers/AppProvider.tsx']),
        notes: 'This would be a major layout change, moving away from the modal-centric design.'
    },
    {
        name: 'UI/UX: Seamless View Transitions',
        overview: 'Use shared layout animations (like Framer Motion\'s `layoutId`) for smooth transitions when an element moves between different views.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Animate Presence', description: 'Wrap dynamic components in Framer Motion\'s `AnimatePresence` for enter/exit animations.', status: '⚪ Planned' },
            { subFeature: 'Layout IDs', description: 'Apply matching `layoutId` props to elements that should animate between positions.', status: '⚪ Planned' },
        ]),
        logic_flow: 'This is a pure frontend enhancement. When state changes cause a component to move or transform, Framer Motion will automatically animate the transition between the old and new layouts if `layoutId`s match.',
        key_files_json: JSON.stringify(['components/App.tsx', 'components/Sidebar.tsx', 'components/ChatWindow.tsx']),
        notes: 'Can be implemented incrementally to improve visual polish.'
    },
    {
        name: 'Communication Hub: Core',
        overview: 'A new hub for sending and receiving communications from various channels. Includes a central dashboard, unified inbox, and a message template engine.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Channel Dashboard', description: 'View and manage all communication channels.', status: '⚪ Planned' },
            { subFeature: 'Unified Inbox', description: 'View all incoming messages in one place.', status: '⚪ Planned' },
            { subFeature: 'Template Engine', description: 'Create reusable message templates with variables.', status: '⚪ Planned' },
        ]),
        logic_flow: 'A new set of API endpoints under /api/comm/... will handle channel management. New DB tables `comm_channels` and `comm_messages` will be created.',
        key_files_json: JSON.stringify(['components/hubs/CommunicationHub.tsx', 'app/api/comm/channels/route.ts', 'scripts/create-tables.js']),
        notes: 'This is a large foundational feature for external integrations.'
    },
    {
        name: 'Communication Hub: Dynamic Channels',
        overview: 'Allows the creation of dynamic, incoming channels, featuring a webhook creator with a visual payload mapper and a conditional trigger builder to start workflows.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Webhook Creator', description: 'Generate a unique webhook URL.', status: '⚪ Planned' },
            { subFeature: 'Visual Payload Mapper', description: 'Map incoming JSON fields to system variables without code.', status: '⚪ Planned' },
            { subFeature: 'Conditional Trigger Builder', description: 'Define IF-THEN rules to trigger actions.', status: '⚪ Planned' },
        ]),
        logic_flow: 'The UI calls an API to create a unique webhook ID. When a request hits `/api/webhook/{id}`, the backend uses the saved mapping and rules for that ID to process the payload and trigger the appropriate workflow.',
        key_files_json: JSON.stringify(['components/comm_hub/WebhookCreator.tsx', 'app/api/webhook/[id]/route.ts']),
        notes: 'The visual payload mapper is the most complex part of this feature.'
    },
    {
        name: 'Communication Hub: Static Channels',
        overview: 'Manage outbound communications, primarily an App Client Broadcast Manager for sending push notifications and in-app messages to our own application\'s clients, with user segmentation.',
        status: '⚪ Planned',
        ui_ux_breakdown_json: JSON.stringify([
            { subFeature: 'Broadcast Manager UI', description: 'A UI to compose and send push notifications or in-app messages.', status: '⚪ Planned' },
            { subFeature: 'User Segmentation UI', description: 'Ability to create user segments based on criteria (e.g., \'new users\', \'power users\').', status: '⚪ Planned' },
        ]),
        logic_flow: 'The UI calls a new API endpoint like `/api/comm/broadcast`. The backend would then handle sending the message, potentially through a third-party service for push notifications.',
        key_files_json: JSON.stringify(['components/comm_hub/BroadcastManager.tsx', 'app/api/comm/broadcast/route.ts']),
        notes: 'Requires a mechanism to track app clients for push notifications.'
    }
];

async function seedFeatures() {
    console.log("Starting to seed features data...");
    try {
        // This script now deletes all existing features and re-inserts them to ensure the data is always up-to-date with the source code.
        console.log("Clearing existing features...");
        // FIX: Added CASCADE to the TRUNCATE command to resolve the foreign key constraint error.
        // This will also truncate the dependent `feature_tests` table, which is the desired behavior for a full seed reset.
        await sql`TRUNCATE TABLE features RESTART IDENTITY CASCADE;`;
        
        const allFeatures = [...featuresData, ...cognitiveFeaturesData, ...newlyProposedFeaturesData];
        
        console.log(`Inserting ${allFeatures.length} total features...`);

        for (const feature of allFeatures) {
            await sql`
                INSERT INTO features (
                    name, 
                    overview, 
                    status, 
                    ui_ux_breakdown_json, 
                    logic_flow, 
                    key_files_json, 
                    notes
                )
                VALUES (
                    ${feature.name}, 
                    ${feature.overview || null}, 
                    ${feature.status}, 
                    ${feature.ui_ux_breakdown_json || null}, 
                    ${feature.logic_flow || null}, 
                    ${feature.key_files_json || null}, 
                    ${feature.notes || null}
                );
            `;
        }
        console.log(`Successfully inserted ${allFeatures.length} features.`);

    } catch (error) {
        console.error("Error seeding features table:", error);
        process.exit(1);
    }
}

async function runAllSeeds() {
    await seedFeatures();
    console.log("Finished seeding features. Now seeding API endpoints...");
    try {
        execSync('node scripts/seed-api-endpoints.js', { stdio: 'inherit' });
        console.log("Successfully seeded API endpoints.");
    } catch (error) {
        console.error("Error seeding API endpoints:", error);
        process.exit(1);
    }
}


runAllSeeds();