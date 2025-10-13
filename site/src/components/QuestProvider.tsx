import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';
import { QuestDataProvider } from './QuestDataProvider';
import QuestTopBarStats from './QuestTopBarStats';
import type { QuestProjectId } from '@quest-src/services/projectManager';

interface QuestProviderProps {
	children?: ReactNode;
	projectIds?: QuestProjectId[];
	preloadedQuestData?: Record<string, any[]>;
}

function QuestTopBarPortal() {
	const [container, setContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setContainer(document.getElementById('quest-topbar-extra'));
	}, []);

	if (!container) return null;
	return createPortal(<QuestTopBarStats />, container);
}

export default function QuestProvider({ children, projectIds, preloadedQuestData }: QuestProviderProps) {
	const normalizedProjectIds = useMemo(() => {
		if (!projectIds || projectIds.length === 0) return undefined;
		return projectIds.map((id) => id.toLowerCase() as QuestProjectId);
	}, [projectIds]);

	return (
		<MetaMaskProvider>
			<QuestDataProvider projectIds={normalizedProjectIds} preloadedQuestData={preloadedQuestData}>
				<QuestTopBarPortal />
				{children ?? null}
			</QuestDataProvider>
		</MetaMaskProvider>
	);
}
