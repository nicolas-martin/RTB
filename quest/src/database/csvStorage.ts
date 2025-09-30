/**
 * CSV Storage Utility
 * Handles reading and writing CSV files for data persistence
 * Uses PapaParse for robust CSV parsing
 */

import Papa from 'papaparse';

export interface CSVOptions {
	headers: string[];
	delimiter?: string;
}

/**
 * Converts an array of objects to CSV string using PapaParse
 */
export function objectsToCSV<T extends Record<string, any>>(
	objects: T[],
	options: CSVOptions
): string {
	const { headers, delimiter = ',' } = options;

	// Use PapaParse to generate CSV
	const csv = Papa.unparse({
		fields: headers,
		data: objects.map((obj) => headers.map((h) => obj[h] ?? '')),
	}, {
		delimiter,
		header: true,
		newline: '\n',
	});

	return csv;
}

/**
 * Converts CSV string to array of objects using PapaParse
 */
export function csvToObjects<T extends Record<string, any>>(
	csv: string,
	options?: { delimiter?: string }
): T[] {
	const { delimiter = ',' } = options || {};

	if (!csv.trim()) return [];

	// Use PapaParse to parse CSV
	const result = Papa.parse<T>(csv, {
		delimiter,
		header: true,
		skipEmptyLines: true,
		transformHeader: (header) => header.trim(),
		transform: (value) => value === '' ? undefined : value,
	});

	if (result.errors.length > 0) {
		console.warn('[CSV] Parse errors:', result.errors);
	}

	return result.data;
}

/**
 * Browser-based file storage using localStorage as a file system
 * In a Node.js environment, this would use the 'fs' module
 */
export class FileStorage {
	private storagePrefix = 'quest_db_';

	/**
	 * Reads a file from storage
	 */
	async readFile(filename: string): Promise<string> {
		if (typeof localStorage === 'undefined') {
			throw new Error('localStorage is not available');
		}

		const key = this.storagePrefix + filename;
		const data = localStorage.getItem(key);

		if (data === null) {
			throw new Error(`File not found: ${filename}`);
		}

		return data;
	}

	/**
	 * Writes a file to storage
	 */
	async writeFile(filename: string, data: string): Promise<void> {
		if (typeof localStorage === 'undefined') {
			throw new Error('localStorage is not available');
		}

		const key = this.storagePrefix + filename;
		localStorage.setItem(key, data);
	}

	/**
	 * Checks if a file exists
	 */
	async fileExists(filename: string): Promise<boolean> {
		if (typeof localStorage === 'undefined') {
			return false;
		}

		const key = this.storagePrefix + filename;
		return localStorage.getItem(key) !== null;
	}

	/**
	 * Deletes a file from storage
	 */
	async deleteFile(filename: string): Promise<void> {
		if (typeof localStorage === 'undefined') {
			throw new Error('localStorage is not available');
		}

		const key = this.storagePrefix + filename;
		localStorage.removeItem(key);
	}

	/**
	 * Lists all files in storage
	 */
	async listFiles(): Promise<string[]> {
		if (typeof localStorage === 'undefined') {
			return [];
		}

		const files: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(this.storagePrefix)) {
				files.push(key.substring(this.storagePrefix.length));
			}
		}

		return files;
	}

	/**
	 * Clears all files from storage
	 */
	async clearAll(): Promise<void> {
		if (typeof localStorage === 'undefined') {
			return;
		}

		const keys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith(this.storagePrefix)) {
				keys.push(key);
			}
		}

		keys.forEach((key) => localStorage.removeItem(key));
	}
}