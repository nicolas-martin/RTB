export const config = {
	API_BASE_URL: 'https://deckofcardsapi.com/api',
	API_TIMEOUT: 10000,
	CARD_BACK_URL:
		'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_06.svg/209px-Card_back_06.svg.png',

	// Game settings
	CARDS_PER_HAND: 4,
	DEFAULT_WAGER: '0.001',

	// UI settings
	CARD_ASPECT_RATIO: 314 / 226,

	// Feature flags
	ENABLE_ANIMATIONS: true,
	ENABLE_SOUND: false,
} as const;

// Type-safe environment check
export const isDevelopment = __DEV__ === true;
export const isProduction = !isDevelopment;
