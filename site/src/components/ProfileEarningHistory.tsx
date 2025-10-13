import { EarningHistory } from './EarningHistory';

/**
 * Wrapper component for EarningHistory on the profile page.
 * Uses the parent QuestProvider context instead of creating duplicate providers.
 * Must be rendered with client:only to avoid SSR context issues.
 */
export function ProfileEarningHistory() {
	return <EarningHistory />;
}
