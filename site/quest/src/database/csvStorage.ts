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
 * API-based file storage using backend server
 */
export class FileStorage {
	private apiUrl: string;
	private apiKey?: string;

	constructor(apiUrl?: string, apiKey?: string) {
		this.apiUrl = apiUrl || import.meta.env.VITE_API_URL;
		this.apiKey = apiKey || import.meta.env.VITE_API_KEY;
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};
		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}
		return headers;
	}

	/**
	 * Reads a file from storage
	 */
	async readFile(filename: string): Promise<string> {
		const response = await fetch(`${this.apiUrl}/csv/${filename}`, {
			headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
		});

		if (!response.ok) {
			throw new Error(`File not found: ${filename}`);
		}

		return response.text();
	}

	/**
	 * Writes a file to storage
	 */
	async writeFile(filename: string, data: string): Promise<void> {
		const response = await fetch(`${this.apiUrl}/csv/${filename}`, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({ content: data }),
		});

		if (!response.ok) {
			throw new Error(`Failed to write file: ${filename}`);
		}
	}

	/**
	 * Deletes a file from storage
	 */
	async deleteFile(_filename: string): Promise<void> {
		// Not implemented - files persist on server
		console.warn('Delete not implemented for API storage');
	}

	/**
	 * Lists all files in storage
	 */
	async listFiles(): Promise<string[]> {
		// Not needed for current implementation
		return ['quest_completions.csv', 'user_points.csv'];
	}

	/**
	 * Clears all files from storage
	 */
	async clearAll(): Promise<void> {
		// Not implemented - files persist on server
		console.warn('Clear all not implemented for API storage');
	}
}
