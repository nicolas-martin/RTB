import { useSound } from 'react-sounds';
import { config } from '../src/config';

export enum SoundType {
	WinRound = 'winRound',
	CashOut = 'cashOut',
	Lose = 'lose',
	SelectionButton = 'selectionButton',
	CardSelect = 'cardSelect',
}

const sounds: Record<SoundType, { name: string; volume?: number }> = {
	[SoundType.WinRound]: { name: 'notification/success', volume: 0.3 },
	[SoundType.CashOut]: { name: 'arcade/level_up', volume: 0.2 },
	[SoundType.Lose]: { name: 'system/device_disconnect', volume: 0.5 },
	[SoundType.SelectionButton]: { name: 'ui/keystroke_soft', volume: 0.5 },
	[SoundType.CardSelect]: { name: 'ui/copy', volume: 0.5 },
};

export const getSoundsToPreload = (): string[] => {
	return Object.values(sounds).map((sound) => sound.name);
};

export const useSounds = () => {
	const winRound = useSound(sounds[SoundType.WinRound].name, {
		volume: sounds[SoundType.WinRound].volume,
	});
	const cashOut = useSound(sounds[SoundType.CashOut].name, {
		volume: sounds[SoundType.CashOut].volume,
	});
	const lose = useSound(sounds[SoundType.Lose].name, {
		volume: sounds[SoundType.Lose].volume,
	});
	const selectionButton = useSound(sounds[SoundType.SelectionButton].name, {
		volume: sounds[SoundType.SelectionButton].volume,
	});
	const cardSelect = useSound(sounds[SoundType.CardSelect].name, {
		volume: sounds[SoundType.CardSelect].volume,
	});

	const playSound = (soundType: SoundType) => {
		if (!config.ENABLE_SOUND) return;

		switch (soundType) {
			case SoundType.WinRound:
				winRound.play();
				break;
			case SoundType.CashOut:
				cashOut.play();
				break;
			case SoundType.Lose:
				lose.play();
				break;
			case SoundType.SelectionButton:
				selectionButton.play();
				break;
			case SoundType.CardSelect:
				cardSelect.play();
				break;
		}
	};

	return { playSound };
};
