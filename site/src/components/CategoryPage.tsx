import { useMemo } from 'react';
import type { EcosystemProject } from 'astro:content';
import { withBasePath } from '@lib/basePath';
import './CategoryPage.css';

interface CategoryPageProps {
	category: string;
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

export default function CategoryPage({ category, projects, onBack }: CategoryPageProps) {
	const filteredProjects = useMemo(() => {
		if (category === 'All') {
			return projects;
		}
		return projects.filter((project) => 
			project.tags && project.tags.includes(category)
		);
	}, [projects, category]);

	return (
		<div className="category-page">
                    <div className="category-page-header">
                        <button className="back-button" onClick={onBack} aria-label="Go back">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        <h1 className="category-page-title">
                            {category} <span className="category-page-count">({filteredProjects.length})</span>
                        </h1>
                    </div>

			<div className="projects-grid">
				{filteredProjects.map((project) => {
					const logoSrc = normaliseLogoSrc(project.logo_src);
					return (
						<div key={project.name} className="project-card">
							<div className="project-logo">
								{logoSrc ? (
									<img src={logoSrc} alt={project.logo_alt ?? project.name} loading="lazy" />
								) : (
									<div className="logo-placeholder">{project.name[0]}</div>
								)}
							</div>
							<h3 className="project-title">{project.name}</h3>
							<p className="project-description">{project.description}</p>
							{project.website && (
								<a 
									href={project.website} 
									target="_blank" 
									rel="noopener noreferrer"
									className="project-link"
								>
									Visit site
								</a>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
