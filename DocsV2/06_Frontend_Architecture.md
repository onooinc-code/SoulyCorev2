# SoulyCore v2: Frontend Architecture

**Document Version:** 1.0
**Status:** Live

---

### 1. Overview

The SoulyCore frontend is a sophisticated, single-page application built with Next.js (App Router), React, and TypeScript. It is designed to be a highly responsive, performant, and intuitive interface for power users. The architecture prioritizes a clean separation of concerns, centralized state management, and a modular component system.

### 2. State Management

Global client-side state is managed using the **React Context API** to avoid external library dependencies and leverage built-in React features.

*   **`AppProvider.tsx`**: This is the primary state container for the application. It manages all critical UI state and data, including:
    *   `conversations`: The list of all chat sessions.
    *   `currentConversation`: The currently active conversation object.
    *   `messages`: The list of messages for the active conversation.
    *   `settings`: Global application settings.
    *   `isLoading`: A boolean flag indicating when a primary API call (like generating a response) is in progress.
    *   `backgroundTaskCount`: A counter for asynchronous background tasks (like memory extraction) to drive the `UniversalProgressIndicator`.
    *   **Logic:** The provider contains all the client-side logic for fetching data from the API, sending new messages, updating settings, and orchestrating all user-initiated actions. It acts as the bridge between the UI components and the backend API.

*   **`LogProvider.tsx`**: A dedicated context provider for the developer log panel. It manages the state of log entries and handles fetching and clearing logs from the backend, keeping this specific concern isolated from the main application state.

### 3. Component Hierarchy & Responsibilities

The UI is built from a hierarchy of reusable React components located in the `components/` directory. Key components include:

*   **`App.tsx`**: The root client component. It orchestrates the main layout, including the `Sidebar` and `ChatWindow`. It also manages the visibility of all top-level modals (e.g., `ContactsHub`, `MemoryCenter`, `BrainCenter`) and the global right-click `ContextMenu`.

*   **`Sidebar.tsx`**: The main navigation panel. It is responsible for:
    *   Displaying the list of conversations, grouped by date.
    *   Handling the creation of new chats.
    *   Providing search functionality for conversations.
    *   Acting as the primary entry point for all major "Hub" and "Center" modals.

*   **`ChatWindow.tsx`**: The main content area where the user interacts with the AI. It is responsible for:
    *   Rendering the `Header` component with conversation-specific controls.
    *   Mapping over the `messages` state from `AppProvider` and rendering each `Message` component.
    *   Displaying the `ChatInput` component at the bottom.
    *   Managing the `StatusBar` with real-time conversation statistics.

*   **`Message.tsx`**: Renders a single message bubble. Its responsibilities include:
    *   Displaying user and model messages with distinct styling.
    *   Rendering Markdown content.
    *   Displaying the `MessageToolbar` on hover, which provides actions like copy, bookmark, and inspect.
    *   Handling the "Long Message Collapse" feature with auto-summarization.

*   **`ChatInput.tsx`**: The user's primary interaction point. It handles:
    *   Text input and submission.
    *   `@mention` functionality for contacts.
    *   Image attachment.
    *   The "Prompts Hub" launcher for using saved prompt templates.

### 4. UI/UX Philosophy

The user experience is tailored for a professional, power-user audience.

*   **Design System:** A modern, dark-themed aesthetic built with **Tailwind CSS** provides a clean, consistent, and professional look.
*   **Interactivity:** **Framer Motion** is used for all major animations and transitions, giving the application a fluid and responsive feel.
*   **Efficiency:** Features like the global right-click `ContextMenu`, extensive keyboard shortcuts (`use-keyboard-shortcuts.ts`), and slash commands are designed to accelerate user workflows.
*   **Performance:** Large, complex components like the various Hub modals are dynamically imported using `next/dynamic` to reduce the initial bundle size and improve load times.