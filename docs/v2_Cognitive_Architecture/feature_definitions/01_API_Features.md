
# Feature Registry: API Endpoints

**Status:** All features listed in this document have been **implemented** as part of the Cognitive Architecture v2.0 release.

This document lists the API development work, including refactoring existing endpoints and creating new ones to support the v2 Cognitive Architecture.

| Feature                               | Description                                                                                                    | Key UI/UX Considerations                                      |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| **Refactor `/api/chat` Endpoint**     | Rewrote the primary chat endpoint to delegate all business logic to the new `Context Assembly Pipeline`.         | Existing chat functionality remains seamless to the user.     |
| **Refactor `/api/memory/pipeline` Endpoint** | Rewrote the memory processing endpoint to delegate all logic to the new `Memory Extraction Pipeline`.      | Memory processing is now a background task, improving UI responsiveness. |
| **New Brain Management Endpoints**    | Created a new set of CRUD API endpoints to manage Brain configurations, supporting the Brain Center UI.         | Enables the "Brain Management Tab" to function.               |
| **New Memory Viewer Endpoints**       | Created new read-only API endpoints that allow the Brain Center UI to query the contents of each SMM for inspection. | Enables the "Memory Module Viewer" to display data.           |
