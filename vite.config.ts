import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import react from '@vitejs/plugin-react';

export default defineConfig({
	base: '/rtb/',
	define: {
		__DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
		global: 'window',
	},
	plugins: [
		nodePolyfills(),
		react({
			jsxRuntime: 'classic',
		}),
	],
	resolve: {
		alias: {
			'react-native': 'react-native-web',
		},
		extensions: [
			'.web.tsx',
			'.web.ts',
			'.web.jsx',
			'.web.js',
			'.tsx',
			'.ts',
			'.jsx',
			'.js',
		],
	},
	optimizeDeps: {
		include: ['react-native-web'],
		esbuildOptions: {
			mainFields: ['module', 'main'],
			loader: {
				'.js': 'jsx',
			},
		},
	},
	build: {
		outDir: 'dist-web',
	},
});
