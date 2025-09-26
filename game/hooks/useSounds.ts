import { playSound as playReactSound } from 'react-sounds';
import { config } from '../src/config';

export enum SoundType {
	WinRound = 'winRound',
	CashOut = 'cashOut',
	Lose = 'lose',
	SelectionButton = 'selectionButton',
	CardSelect = 'cardSelect',
}

const sounds: Record<SoundType, string> = {
	[SoundType.WinRound]: 'ui/popup_open',
	[SoundType.CashOut]: 'arcade/level_up',
	[SoundType.Lose]: 'system/device_disconnect',
	[SoundType.SelectionButton]: 'ui/keystroke_soft',
	[SoundType.CardSelect]: 'ui/copy',
};

export const useSounds = () => {
	const playSound = (soundType: SoundType) => {
		if (!config.ENABLE_SOUND) return;

		const soundName = sounds[soundType];
		playReactSound(soundName);
	};

	return { playSound };
};
