
# Task 1-2: Define Core Types & Interfaces

**Related Feature:** `V2 [Core] - Single Memory Module (SMM) Interfaces`

---

### 1. Objective
To define and centralize all shared TypeScript types and interfaces for the Cognitive Engine, establishing a strong data contract for all new modules and services.

### 2. Scope of Work
- Create a new file: `core/memory/types.ts`.
- Define the `IBrain` interface, including properties for `id`, `name`, and `moduleNamespaces`.
- Define a generic `ISingleMemoryModule` interface that all memory modules will implement, including methods like `query()` and `store()`.
- Define specific interfaces for the configuration of each pipeline (e.g., `IContextAssemblyConfig`).
- Export all types and interfaces from the new file.

### 3. Files to be Modified/Created
- `core/memory/types.ts` (created)

### 4. Acceptance Criteria
- [ ] The file `core/memory/types.ts` is created and populated with the necessary type definitions.
- [ ] The `IBrain` and `ISingleMemoryModule` interfaces are defined and exported.
- [ ] The code compiles without any TypeScript errors related to the new types.
