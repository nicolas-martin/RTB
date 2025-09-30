import { useMemo, useState } from 'react';
import type { EcosystemProject } from 'astro:content';
import './EcosystemExplorer.css';

type Props = {
	projects: EcosystemProject['projects'];
};

const normaliseLogoSrc = (src?: string): string | undefined => {
	if (!src) return undefined;
	if (src.startsWith('./')) {
		return '/' + src.replace(/^\.\//, '');
	}
	if (src.startsWith('Plasma Dashboard_files')) {
		return src.replace('Plasma Dashboard_files', '/icons');
	}
	return src;
};

export default function EcosystemExplorer({ projects }: Props) {
	const [activeTag, setActiveTag] = useState<string>('All');
	const [search, setSearch] = useState('');

	const tags = useMemo(() => {
		const tagSet = new Set<string>();
		projects.forEach((project) => {
			(project.tags ?? []).forEach((tag) => tagSet.add(tag));
		});
		return ['All', ...Array.from(tagSet).sort((a, b) => a.localeCompare(b))];
	}, [projects]);

	const filteredProjects = useMemo(() => {
		const loweredSearch = search.toLowerCase();
		return projects.filter((project) => {
			const matchesTag =
				activeTag === 'All' || (project.tags ?? []).some((tag) => tag === activeTag);
			if (!matchesTag) return false;

			if (!loweredSearch) return true;

			const haystack = [project.name, project.description ?? '', ...(project.tags ?? [])]
				.join(' ')
				.toLowerCase();

			return haystack.includes(loweredSearch);
		});
	}, [projects, activeTag, search]);

	return (
		<div className="ecosystem">
			<aside className="filters">
				<div className="filters-card">
					<h2>Filter Projects</h2>
					<input
						type="search"
						placeholder="Search projects"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div className="tag-list">
						{tags.map((tag) => (
							<button
								key={tag}
								type="button"
								className={['tag-chip', activeTag === tag ? 'active' : ''].join(' ')}
								onClick={() => setActiveTag(tag)}
							>
								{tag}
							</button>
						))}
					</div>
				</div>
			</aside>
			<section className="projects">
				{filteredProjects.length === 0 ? (
					<div className="empty">No projects match the current filter.</div>
				) : (
					<div className="project-grid">
						{filteredProjects.map((project) => {
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
											<h3>{project.name}</h3>
											{project.website && (
												<a href={project.website} target="_blank" rel="noopener noreferrer">
													Visit site
												</a>
											)}
										</div>
									</header>
									{project.tags && project.tags.length > 0 && (
										<div className="tag-row">
											{project.tags.map((tag) => (
												<span className="badge" key={tag}>
													{tag}
												</span>
											))}
										</div>
									)}
									{project.description && <p className="description">{project.description}</p>}
								</article>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
