const eslint = require('@eslint/js');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
	{
		ignores: [
			'node_modules/**',
			'.yarn/**',
			'dist/**',
			'dist-web/**',
			'build/**',
			'coverage/**',
			'ios/**',
			'android/**',
			'*.config.js',
			'babel.config.js',
			'metro.config.js',
			'__tests__/**',
			'contract/**',
		],
	},
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 2021,
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				__DEV__: 'readonly',
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				global: 'readonly',
				require: 'readonly',
				module: 'readonly',
				exports: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				setInterval: 'readonly',
				setTimeout: 'readonly',
				clearInterval: 'readonly',
				clearTimeout: 'readonly',
				setImmediate: 'readonly',
				clearImmediate: 'readonly',
				Promise: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescriptPlugin,
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
			prettier: prettierPlugin,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...eslint.configs.recommended.rules,
			...typescriptPlugin.configs.recommended.rules,
			...reactPlugin.configs.recommended.rules,
			...reactHooksPlugin.configs.recommended.rules,
			'prettier/prettier': 'error',
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react/display-name': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'no-console': [
				'warn',
				{
					allow: ['warn', 'error'],
				},
			],
			'prefer-const': 'error',
			'no-undef': 'off', // TypeScript handles this
			'no-duplicate-imports': 'error',
		},
	},
];
