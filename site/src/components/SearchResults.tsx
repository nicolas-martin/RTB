import { useMemo } from 'react';
import type { EcosystemProject } from 'astro:content';
import { withBasePath } from '@lib/basePath';
import './SearchResults.css';

interface SearchResultsProps {
	searchTerm: string;
	projects: EcosystemProject['projects'];
	onBack: () => void;
	onTouchStart?: (event: React.TouchEvent) => void;
	onTouchEnd?: (event: React.TouchEvent) => void;
	onMouseDown?: (event: React.MouseEvent) => void;
	onMouseUp?: (event: React.MouseEvent) => void;
	onMouseLeave?: () => void;
	onWheel?: (event: React.WheelEvent) => void;
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

export default function SearchResults({ searchTerm, projects, onBack, onTouchStart, onTouchEnd, onMouseDown, onMouseUp, onMouseLeave, onWheel }: SearchResultsProps) {
	const filteredProjects = useMemo(() => {
		if (!searchTerm.trim()) return projects;
		
		const search = searchTerm.toLowerCase();
		return projects.filter((project) => {
			const searchableText = [
				project.name,
				project.description ?? '',
				...(project.tags ?? [])
			].join(' ').toLowerCase();
			
			return searchableText.includes(search);
		});
	}, [projects, searchTerm]);

	return (
		<div 
			className="search-results" 
			onTouchStart={onTouchStart} 
			onTouchEnd={onTouchEnd}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onMouseLeave={onMouseLeave}
			onWheel={onWheel}
		>
			<div className="search-results-header">
				<button className="back-button" onClick={onBack} aria-label="Go back">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
				<h1 className="search-results-title">
					Search: "{searchTerm}" <span className="search-results-count">({filteredProjects.length})</span>
				</h1>
			</div>

			<div className="projects-grid">
				{filteredProjects.length === 0 ? (
					<div className="no-results">
						<p>No projects found matching "{searchTerm}"</p>
						<p>Try a different search term or browse categories.</p>
					</div>
				) : (
					filteredProjects.map((project) => {
						const logoSrc = normaliseLogoSrc(project.logo_src);
						return (
							<article className="project-card" key={project.name}>
								<header>
									<div className="logo-wrap">
										{logoSrc ? (
											<img src={logoSrc} alt={project.logo_alt ?? project.name} loading="lazy" />
										) : (
											<div className="logo-placeholder">{project.name[0]}</div>
										)}
									</div>
									<div className="heading">
										<div className="title-row">
											<h3>{project.name}</h3>
										</div>
									<div className="heading-actions">
										{project.website && (
											<a href={project.website} target="_blank" rel="noopener noreferrer">
												Visit site
											</a>
										)}
										<div className="social-links">
											{project.twitter && (
												<a 
													href={project.twitter} 
													target="_blank" 
													rel="noopener noreferrer"
													className="social-link"
													aria-label="Twitter"
												>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
														<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
													</svg>
												</a>
											)}
											{project.discord && (
												<a 
													href={project.discord} 
													target="_blank" 
													rel="noopener noreferrer"
													className="social-link"
													aria-label="Discord"
												>
													<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
														<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
													</svg>
												</a>
											)}
										</div>
									</div>
									</div>
								</header>
								{project.description && <p className="description">{project.description}</p>}
							</article>
						);
					})
				)}
			</div>
		</div>
	);
}
