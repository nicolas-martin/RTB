/**
 * Database Module
 * Main entry point for database operations
 */

export * from './types';
export * from './csvDatabase';
export * from './csvStorage';
export * from './apiDatabase';
export * from './questDatabaseService';

import type { IQuestDatabase } from './types';
import { LocalStorageDatabase } from './localStorageDatabase';

/**
 * Database factory function
 * Returns the current database implementation (CSV by default)
 *
 * To migrate to a real database:
 * 1. Create a new class that implements IQuestDatabase (e.g., ApiDatabase)
 * 2. Update this function to return your new implementation
 * 3. No other code changes needed!
 *
 * Example for API database:
 * ```
 * const apiDb = new ApiDatabase();
 * await apiDb.initialize({
 *   apiEndpoint: 'https://your-server.com/api',
 *   apiKey: 'your-api-key'
 * });
 * setDatabase(apiDb);
 * ```
 */
export function createDatabase(): IQuestDatabase {
	return new LocalStorageDatabase();
}

/**
 * Singleton instance for convenience
 * Use this if you want to share one database instance across your app
 */
let databaseInstance: IQuestDatabase | null = null;

export function getDatabase(): IQuestDatabase {
	if (!databaseInstance) {
		databaseInstance = createDatabase();
	}
	return databaseInstance;
}

/**
 * Set a custom database instance (useful for switching to API database)
 */
export function setDatabase(database: IQuestDatabase): void {
	databaseInstance = database;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetDatabase(): void {
	databaseInstance = null;
}
