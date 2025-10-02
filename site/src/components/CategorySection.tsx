import { useRef } from 'react';
import type { EcosystemProject } from 'astro:content';
import { withBasePath } from '@lib/basePath';
import './CategorySection.css';

interface CategorySectionProps {
	category: string;
	projects: EcosystemProject['projects'];
	onProjectClick?: (project: EcosystemProject['projects'][0]) => void;
	onSeeAll?: (category: string) => void;
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

export default function CategorySection({ category, projects, onProjectClick, onSeeAll }: CategorySectionProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const scrollLeft = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
		}
	};

	const scrollRight = () => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
		}
	};

	const displayProjects = projects.slice(0, 10); // Limit to 10 apps per section

	return (
		<section className="category-section">
                    <div className="category-section-header">
                        <h2 className="category-section-title">{category}</h2>
                        <button
                            className="see-all-link"
                            onClick={() => onSeeAll?.(category)}
                        >
                            See all
                        </button>
                    </div>
			
			<div className="category-content">
				<button 
					className="scroll-button scroll-left" 
					onClick={scrollLeft}
					aria-label={`Scroll ${category} left`}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>

				<div className="projects-scroll" ref={scrollContainerRef}>
					<div className="projects-container">
						{displayProjects.map((project) => {
							const logoSrc = normaliseLogoSrc(project.logo_src);
							return (
								<div 
									key={project.name} 
									className="project-card"
									onClick={() => onProjectClick?.(project)}
								>
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
											onClick={(e) => e.stopPropagation()}
										>
											Visit site
										</a>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<button 
					className="scroll-button scroll-right" 
					onClick={scrollRight}
					aria-label={`Scroll ${category} right`}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
			</div>
		</section>
	);
}
