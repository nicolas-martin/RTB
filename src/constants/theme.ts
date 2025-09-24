export const Colors = {
	primary: '#5cb85c',
	secondary: '#495057',
	danger: '#dc3545',
	warning: '#ffc107',
	info: '#17a2b8',
	dark: '#22303f',
	light: '#f8f9fa',
	white: '#ffffff',
	black: '#000000',

	// Semantic colors
	background: '#22303f',
	cardBackground: '#ffffff',
	text: '#333333',
	textLight: '#ffffff',
	textMuted: '#6c757d',
	border: '#dee2e6',
} as const;

export const Spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	xxl: 48,
} as const;

export const FontSizes = {
	xs: 12,
	sm: 14,
	md: 16,
	lg: 20,
	xl: 24,
	xxl: 32,
} as const;

export const BorderRadius = {
	sm: 4,
	md: 8,
	lg: 12,
	xl: 16,
	round: 9999,
} as const;

export const Shadows = {
	sm: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.18,
		shadowRadius: 1.0,
		elevation: 1,
	},
	md: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	lg: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
	},
} as const;
