import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { Orientation } from '../types';

export const useOrientation = (): Orientation => {
	const [orientation, setOrientation] = useState<Orientation>(() => {
		const dim = Dimensions.get('screen');
		return dim.height >= dim.width ? 'portrait' : 'landscape';
	});

	useEffect(() => {
		const updateOrientation = () => {
			const dim = Dimensions.get('screen');
			setOrientation(dim.height >= dim.width ? 'portrait' : 'landscape');
		};

		const subscription = Dimensions.addEventListener(
			'change',
			updateOrientation
		);

		return () => {
			subscription?.remove();
		};
	}, []);

	return orientation;
};
