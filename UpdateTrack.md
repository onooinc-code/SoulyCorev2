
... (Existing entries) ...

---

### Update #31: Full Cognitive Transparency & Static Memory (v0.4.19)

**Details:**
Enhanced the Memory Quadrant Monitor with deeper transparency tools and integrated static memory (User Profile) access directly into the status bar.

**Changes Made:**
- **Status 'Null':** Added a new state for memory monitors (Amber color) representing "Successful query, 0 results found".
- **Query Tracking:** Modified `ConversationProvider` to store the `query` text sent to each tier, now visible in `MemoryInspectorModal`.
- **Identity Monitor:** Added a new button in `StatusBar` to open the `ProfileModal`.
- **Profile Modal:** Created a new UI component to display permanent user data, preferences, and long-term harvested facts.
- **Metadata Logic:** Refined the metadata processing to automatically determine and set 'null' vs 'success' status based on result payloads.
