import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
	},
	resolve: {
		alias: {
			'@/models': resolve(__dirname, './src/models'),
			'@/services': resolve(__dirname, './src/services'),
			'@/types': resolve(__dirname, './src/types'),
			'@/database': resolve(__dirname, './src/database'),
			'@/validators': resolve(__dirname, './src/validators'),
		},
	},
});
