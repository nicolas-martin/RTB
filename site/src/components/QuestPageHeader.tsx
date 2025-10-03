import { withBasePath } from '@lib/basePath';

interface QuestPageHeaderProps {
	projectId: string;
	projectName: string;
	onBack: () => void;
}

export default function QuestPageHeader({ projectId, projectName, onBack }: QuestPageHeaderProps) {
	return (
		<div className="quest-page-header">
			<button className="back-button" onClick={onBack} aria-label="Go back">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
					<path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
				</svg>
			</button>
			<h1 className="quest-page-title">{projectName}</h1>
		</div>
	);
}

