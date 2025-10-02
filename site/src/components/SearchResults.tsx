import { useMemo } from 'react';
import type { EcosystemProject } from 'astro:content';
import { withBasePath } from '@lib/basePath';
import './SearchResults.css';

interface SearchResultsProps {
	searchTerm: string;
	projects: EcosystemProject['projects'];
	onBack: () => void;
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

export default function SearchResults({ searchTerm, projects, onBack }: SearchResultsProps) {
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
		<div className="search-results">
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
