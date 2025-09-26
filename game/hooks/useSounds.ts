import { playSound as playReactSound } from 'react-sounds';
import { config } from '../src/config';

// Using react-sounds library sound names
// See: https://www.reactsounds.com/sounds
const sounds = {
	cardHover: 'ui/copy',
	winRound: 'notification/success',
	cashOut: 'arcade/level_up',
	lose: 'system/device_disconnect',
} as const;

export type SoundType = keyof typeof sounds;

export const useSounds = () => {
	const playSound = (soundType: SoundType) => {
		if (!config.ENABLE_SOUND) return;

		const soundName = sounds[soundType];
		playReactSound(soundName);
	};

	return { playSound };
};
