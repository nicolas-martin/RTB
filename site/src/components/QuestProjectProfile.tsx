import { withBasePath } from '@lib/basePath';
import QuestProgressDonut from './QuestProgressDonut';

interface QuestProjectProfileProps {
	project: {
		id: string;
		name: string;
		description?: string;
		website?: string;
		twitter?: string;
		discord?: string;
		logo_src?: string;
		logo_alt?: string;
	};
	ecosystemProject?: {
		website?: string;
		twitter?: string;
		discord?: string;
		logo_src?: string;
		logo_alt?: string;
		description?: string;
		cover_image?: string;
	};
	completed?: number;
	total?: number;
	points?: number;
}

const normaliseLogoSrc = (src?: string): string | undefined => {
	if (!src) return undefined;
	if (/^https?:\/\//.test(src)) return src;
	if (src.startsWith('./')) {
		return withBasePath(src.replace(/^\.\//, '/'));
	}
	if (src.startsWith('June Dashboard_files')) {
		return withBasePath(src.replace('June Dashboard_files', '/icons'));
	}
	return withBasePath(src);
};

export default function QuestProjectProfile({ project, ecosystemProject, completed = 0, total = 0, points = 0 }: QuestProjectProfileProps) {
	// Use ecosystem project data when available, fallback to quest project data
	const displayProject = ecosystemProject || project;
	const logoSrc = normaliseLogoSrc(displayProject.logo_src);
	const coverImageSrc = displayProject.cover_image;
	const description = displayProject.description || project.description;
	const website = displayProject.website || project.website;
	const twitter = displayProject.twitter || project.twitter;
	const discord = displayProject.discord || project.discord;

	// Debug: log all relevant data
	console.log('[QuestProjectProfile] Received data:', {
		hasEcosystemProject: !!ecosystemProject,
		project,
		ecosystemProject,
		logoSrc,
		coverImageSrc,
		twitter,
		discord,
		website
	});

	return (
		<div className="quest-project-profile">
			{/* Cover Image - Centered */}
			<div 
				className="quest-cover-image"
				style={coverImageSrc ? {
					backgroundImage: `url(${coverImageSrc})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat'
				} : {}}
			>
				<div className="quest-cover-overlay">
					<div className="quest-cover-logo">
						{logoSrc ? (
							<img src={logoSrc} alt={displayProject.logo_alt ?? project.name} />
						) : (
							<div className="quest-logo-placeholder">{project.name[0]}</div>
						)}
					</div>
				</div>
			</div>

			{/* Social Links - Centered under cover */}
			{(twitter || discord) && (
				<div className="quest-social-links">
					{twitter && (
						<a 
							href={twitter} 
							target="_blank" 
							rel="noopener noreferrer"
							className="quest-social-link"
							aria-label="Twitter"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
							</svg>
						</a>
					)}
					{discord && (
						<a 
							href={discord} 
							target="_blank" 
							rel="noopener noreferrer"
							className="quest-social-link"
							aria-label="Discord"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
							</svg>
						</a>
					)}
				</div>
			)}

			{/* Website Link - Positioned with social icons */}
			{website && (
				<a 
					href={website} 
					target="_blank" 
					rel="noopener noreferrer"
					className="quest-website-link"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M10 6V8H5V19H16V14H18V19C18 20.1 17.1 21 16 21H5C3.9 21 3 20.1 3 19V8C3 6.9 3.9 6 5 6H10ZM21 3V11H19V6.41L9.41 16L8 14.59L17.59 5H13V3H21Z"/>
					</svg>
				</a>
			)}

			{/* Project Info - Centered */}
			<div className="quest-project-info">
				{description && (
					<p className="quest-project-description">{description}</p>
				)}
			</div>
		</div>
	);
}
