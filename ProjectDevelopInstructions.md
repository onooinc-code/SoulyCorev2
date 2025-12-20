# Project Development Instructions

This document provides the official guidelines for tracking bugs and feature updates within the project. Adherence to these instructions is mandatory for all code changes to ensure a clear and maintainable project history.

---

## `BugTrack.md`

### Purpose
The `BugTrack.md` file is a log exclusively for documenting **errors, bugs, and their solutions**. Its purpose is to create a historical record of problems encountered and how they were resolved.

### When to Use
Use this file **only when you are fixing a bug**. A bug is defined as behavior that contradicts the intended functionality of the application.

### Process
1.  **Read First:** Before implementing a fix, read `BugTrack.md` to see if a similar issue has been solved before.
2.  **Add Entry:** After fixing the bug, add a new entry to the bottom of the file.
3.  **Format:**
    - Add a horizontal rule (`---`) to separate your entry from the previous one.
    - Create a new heading for the bug (e.g., `### Bug #[Number]: [Brief Description]`).
    - Document the **Error Details**, the **Solution Implemented**, and list all **Modified Files**.

---

## `UpdateTrack.md`

### Purpose
The `UpdateTrack.md` file is a log for all **new features, enhancements, and modifications** that are not bug fixes. It tracks the evolution and growth of the project's capabilities.

### When to Use
Use this file for any of the following:
- Adding a new feature or component.
- Enhancing an existing feature with new functionality.
- Refactoring code for improvement (not fixing a bug).
- Adding or modifying project documentation or configuration files.
- **IMPORTANT:** Any modification, no matter how small (UI tweak, typo fix, refactor), MUST be logged in `UpdateTrack.md`.

### Process
1.  **Read First:** Before adding or modifying a feature, read `UpdateTrack.md` to understand the recent development history.
2.  **Add Entry:** After completing the development, add a new entry to the bottom of the file.
3.  **Format:**
    - Add a horizontal rule (`---`) to separate your entry from the previous one.
    - Create a new, numbered heading (e.g., `### Update #[Number]: [Brief Description]`).
    - Provide **Details** of the update.
    - List all **Modified Files** (including new files).
    - Describe the **Changes Made** in each file.

---
**Golden Rule:** Every code change must result in an entry in either `BugTrack.md` or `UpdateTrack.md`.