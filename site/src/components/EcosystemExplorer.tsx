import { useMemo, useState, useEffect, useRef } from 'react';
import type { EcosystemProject } from 'astro:content';
import { withBasePath } from '@lib/basePath';
import PromotionalBanner from './PromotionalBanner';
import CategorySection from './CategorySection';
import CategoryPage from './CategoryPage';
import SearchResults from './SearchResults';
import './EcosystemExplorer.css';

type Props = {
	projects: EcosystemProject['projects'];
};

const normaliseLogoSrc = (src?: string): string | undefined => {
	if (!src) return undefined;
	if (/^https?:\/\//.test(src)) return src;
	if (src.startsWith('./')) {
		return withBasePath(src.replace(/^\.\//, '/'));
	}
	if (src.startsWith('Plasma Dashboard_files')) {
		return withBasePath(src.replace('Plasma Dashboard_files', '/icons'));
	}
	return withBasePath(src);
};

export default function EcosystemExplorer({ projects }: Props) {
	const [search, setSearch] = useState('');
	const [currentView, setCurrentView] = useState<'main' | 'category' | 'search'>('main');
	const [selectedCategory, setSelectedCategory] = useState<string>('');
	const [mainPageScrollPosition, setMainPageScrollPosition] = useState(0);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
				event.preventDefault();
				searchInputRef.current?.focus();
			} else if (event.key === 'Escape' && currentView === 'search') {
				event.preventDefault();
				setSearch('');
				setCurrentView('main');
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [currentView]);

	// Navigate to search results when typing
	useEffect(() => {
		if (search.trim()) {
			// Save current scroll position before leaving main page
			if (currentView === 'main') {
				setMainPageScrollPosition(window.scrollY);
			}
			setCurrentView('search');
			// Maintain focus on search input after view change
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 0);
		}
	}, [search, currentView]);

	// Handle scroll position when view changes
	useEffect(() => {
		if (currentView === 'main') {
			// Restore scroll position when returning to main page
			window.scrollTo(0, mainPageScrollPosition);
		} else if (currentView === 'category' || currentView === 'search') {
			// Scroll to top when entering category or search page
			window.scrollTo(0, 0);
		}
	}, [currentView, mainPageScrollPosition]);

	// Filter projects based on search term
	const filteredProjects = useMemo(() => {
		if (!search.trim()) return projects;
		
		const searchTerm = search.toLowerCase();
		return projects.filter((project) => {
			const searchableText = [
				project.name,
				project.description ?? '',
				...(project.tags ?? [])
			].join(' ').toLowerCase();
			
			return searchableText.includes(searchTerm);
		});
	}, [projects, search]);

	const tags = useMemo(() => {
		const tagSet = new Set<string>();
		projects.forEach((project) => {
			(project.tags ?? []).forEach((tag) => tagSet.add(tag));
		});
		return ['All', ...Array.from(tagSet).sort((a, b) => a.localeCompare(b))];
	}, [projects]);


	// Group projects by category
	const projectsByCategory = useMemo(() => {
		const grouped: Record<string, typeof projects> = {};
		
		projects.forEach((project) => {
			if (project.tags && project.tags.length > 0) {
				project.tags.forEach((tag) => {
					if (!grouped[tag]) {
						grouped[tag] = [];
					}
					grouped[tag].push(project);
				});
			} else {
				// Projects without tags go to "Other"
				if (!grouped['Other']) {
					grouped['Other'] = [];
				}
				grouped['Other'].push(project);
			}
		});
		
		return grouped;
	}, [projects]);

	if (currentView === 'category') {
		return (
			<div className="ecosystem">
				<aside className="filters">
					<input
						ref={searchInputRef}
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
								className={['tag-chip', selectedCategory === tag ? 'active' : ''].join(' ')}
							onClick={() => {
								setSelectedCategory(tag);
								setCurrentView('category');
							}}
							>
								{tag}
							</button>
						))}
					</div>
				</aside>
				<CategoryPage
					category={selectedCategory}
					projects={projects}
					onBack={() => setCurrentView('main')}
				/>
			</div>
		);
	}

	if (currentView === 'search') {
		return (
			<div className="ecosystem">
				<aside className="filters">
					<input
						ref={searchInputRef}
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
								className={['tag-chip', selectedCategory === tag ? 'active' : ''].join(' ')}
								onClick={() => {
									// Save current scroll position before leaving main page
									if (currentView === 'main') {
										setMainPageScrollPosition(window.scrollY);
									}
									setSearch('');
									setSelectedCategory(tag);
									setCurrentView('category');
								}}
							>
								{tag}
							</button>
						))}
					</div>
				</aside>
				<SearchResults
					searchTerm={search}
					projects={projects}
					onBack={() => {
						setSearch('');
						setCurrentView('main');
					}}
				/>
			</div>
		);
	}

	return (
		<div className="ecosystem">
			<PromotionalBanner />
			<aside className="filters">
				<input
					ref={searchInputRef}
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
							className={['tag-chip', selectedCategory === tag ? 'active' : ''].join(' ')}
							onClick={() => {
								// Save current scroll position before leaving main page
								setMainPageScrollPosition(window.scrollY);
								setSelectedCategory(tag);
								setCurrentView('category');
							}}
						>
							{tag}
						</button>
					))}
				</div>
			</aside>
			<section className="projects">
				{Object.entries(projectsByCategory).map(([category, categoryProjects]) => (
					<CategorySection
						key={category}
						category={category}
						projects={categoryProjects}
						onSeeAll={(category) => {
							// Save current scroll position before leaving main page
							setMainPageScrollPosition(window.scrollY);
							setSelectedCategory(category);
							setCurrentView('category');
						}}
					/>
				))}
			</section>
		</div>
	);
}
