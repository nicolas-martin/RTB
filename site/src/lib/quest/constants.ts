/**
 * Quest system constants
 */

// Active campaign projects (have quests)
export const ACTIVE_CAMPAIGN_IDS = ['rtb'] as const;

// Partner app projects (transactions only, no quests)
export const PARTNER_APP_IDS = ['aave', 'gluex', 'fluid'] as const;

// All projects that accumulate points (active campaigns + partner apps)
export const QUEST_PROJECT_IDS = [...ACTIVE_CAMPAIGN_IDS, ...PARTNER_APP_IDS] as const;

export type ActiveCampaignId = (typeof ACTIVE_CAMPAIGN_IDS)[number];
export type PartnerAppId = (typeof PARTNER_APP_IDS)[number];
export type QuestProjectId = (typeof QUEST_PROJECT_IDS)[number];

// Test wallet for development
export const TEST_WALLET_ADDRESS = '0xb073d8985c6dee0f89272ac02a5565f9a1684a60';
