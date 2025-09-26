import { MotionValue } from 'motion';

export const animations = {
	cardHover: {
		scale: 1.05,
		y: -10,
		transition: {
			duration: 0.2,
			ease: 'easeOut',
		},
	},

	winRound: {
		scale: [1, 1.2, 1],
		rotate: [0, 10, -10, 0],
		transition: {
			duration: 0.6,
			ease: 'easeInOut',
		},
	},

	cashOut: {
		scale: [1, 1.5, 1],
		opacity: [1, 1, 0.8, 1],
		transition: {
			duration: 0.8,
			ease: 'easeInOut',
		},
	},

	lose: {
		x: [-5, 5, -5, 5, 0],
		opacity: [1, 0.8, 1],
		transition: {
			duration: 0.5,
			ease: 'easeInOut',
		},
	},

	cardFlip: {
		rotateY: [0, 180],
		transition: {
			duration: 0.4,
			ease: 'easeInOut',
		},
	},
} as const;

export type AnimationType = keyof typeof animations;

