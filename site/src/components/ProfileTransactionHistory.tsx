import { ProjectTransactionHistory } from './ProjectTransactionHistory';

/**
 * Wrapper component for ProjectTransactionHistory on the profile page.
 * Uses the parent QuestProvider context instead of creating duplicate providers.
 * Must be rendered with client:only to avoid SSR context issues.
 */
export function ProfileTransactionHistory() {
	return <ProjectTransactionHistory />;
}
