// FIX: This file had incorrect relative paths, causing type import errors across the app.
// It should re-export types from the `lib/types` directory.
// Re-exporting from the index file within the types directory to simplify the module structure.
export * from './types/index';
