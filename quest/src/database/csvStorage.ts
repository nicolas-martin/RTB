/**
 * CSV Storage Utility
 * Handles reading and writing CSV files for data persistence
 */

export interface CSVOptions {
	headers: string[];
	delimiter?: string;
}

/**
 * Converts an array of objects to CSV string
 */
export function objectsToCSV<T extends Record<string, any>>(
	objects: T[],
	options: CSVOptions
): string {
	const { headers, delimiter = ',' } = options;

	// Create header row
	const headerRow = headers
		.map((header) => escapeCSVValue(header))
		.join(delimiter);

	// Create data rows
	const dataRows = objects.map((obj) => {
		return headers
			.map((header) => {
				const value = obj[header];
				return escapeCSVValue(value);
			})
			.join(delimiter);
	});

	return [headerRow, ...dataRows].join('\n');
}

/**
 * Converts CSV string to array of objects
 */
export function csvToObjects<T extends Record<string, any>>(
	csv: string,
	options?: { delimiter?: string }
): T[] {
	const { delimiter = ',' } = options || {};

	const lines = csv.split('\n').filter((line) => line.trim());
	if (lines.length === 0) return [];

	// Parse headers
	const headers = parseCSVLine(lines[0], delimiter);

	// Parse data rows
	const objects: T[] = [];
	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i], delimiter);
		const obj: any = {};

		headers.forEach((header, index) => {
			obj[header] = unescapeCSVValue(values[index] || '');
		});

		objects.push(obj as T);
	}

	return objects;
}

/**
 * Escapes a value for CSV format
 */
function escapeCSVValue(value: any): string {
	if (value === null || value === undefined) {
		return '';
	}

	const str = String(value);

	// If value contains comma, newline, or quote, wrap in quotes and escape quotes
	if (str.includes(',') || str.includes('\n') || str.includes('"')) {
		return `"${str.replace(/"/g, '""')}"`;
	}

	return str;
}

/**
 * Unescapes a CSV value
 */
function unescapeCSVValue(value: string): string {
	if (value.startsWith('"') && value.endsWith('"')) {
		return value.slice(1, -1).replace(/""/g, '"');
	}
	return value;
}

/**
 * Parses a single CSV line into values, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote mode
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			// End of value
			values.push(current);
			current = '';
		} else {
			current += char;
		}
	}

	// Add the last value
	values.push(current);

	return values;
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