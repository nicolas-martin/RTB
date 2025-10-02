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
	const [touchStartX, setTouchStartX] = useState<number | null>(null);
	const [mouseStartX, setMouseStartX] = useState<number | null>(null);
	const [isMouseDown, setIsMouseDown] = useState(false);
	const [wheelStartX, setWheelStartX] = useState<number | null>(null);
	const [isWheelGesture, setIsWheelGesture] = useState(false);
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
			// Clear selected category when returning to main page
			setSelectedCategory('');
		} else if (currentView === 'category' || currentView === 'search') {
			// Scroll to top when entering category or search page
			window.scrollTo(0, 0);
		}
	}, [currentView, mainPageScrollPosition]);

	// Handle swipe gesture for going back
	const handleTouchStart = (event: React.TouchEvent) => {
		if (currentView === 'category' || currentView === 'search') {
			setTouchStartX(event.touches[0].clientX);
		}
	};

	const handleTouchEnd = (event: React.TouchEvent) => {
		if (touchStartX === null || (currentView !== 'category' && currentView !== 'search')) {
			return;
		}

		const touchEndX = event.changedTouches[0].clientX;
		const swipeDistance = touchEndX - touchStartX;
		const minSwipeDistance = 100; // Minimum distance for a valid swipe

		// Check if it's a right-to-left swipe with sufficient distance
		if (swipeDistance < -minSwipeDistance) {
			// Go back to main page
			if (currentView === 'search') {
				setSearch('');
				setCurrentView('main');
			} else if (currentView === 'category') {
				setCurrentView('main');
			}
		}

		setTouchStartX(null);
	};

	// Handle mouse gesture for going back
	const handleMouseDown = (event: React.MouseEvent) => {
		if (currentView === 'category' || currentView === 'search') {
			setMouseStartX(event.clientX);
			setIsMouseDown(true);
		}
	};

	const handleMouseUp = (event: React.MouseEvent) => {
		if (!isMouseDown || mouseStartX === null || (currentView !== 'category' && currentView !== 'search')) {
			setIsMouseDown(false);
			setMouseStartX(null);
			return;
		}

		const mouseEndX = event.clientX;
		const swipeDistance = mouseEndX - mouseStartX;
		const minSwipeDistance = 100; // Minimum distance for a valid swipe

		// Check if it's a right-to-left swipe with sufficient distance
		if (swipeDistance < -minSwipeDistance) {
			// Go back to main page
			if (currentView === 'search') {
				setSearch('');
				setCurrentView('main');
			} else if (currentView === 'category') {
				setCurrentView('main');
			}
		}

		setIsMouseDown(false);
		setMouseStartX(null);
	};

	const handleMouseLeave = () => {
		setIsMouseDown(false);
		setMouseStartX(null);
	};

	// Handle trackpad wheel gesture for going back
	const handleWheel = (event: React.WheelEvent) => {
		// Check if this is a horizontal wheel event (trackpad gesture)
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 0) {
			if (currentView === 'category' || currentView === 'search') {
				// Check if it's a right-to-left swipe (negative deltaX)
				if (event.deltaX < 0 && Math.abs(event.deltaX) > 50) {
					event.preventDefault();
					// Go back to main page
					if (currentView === 'search') {
						setSearch('');
						setCurrentView('main');
					} else if (currentView === 'category') {
						setCurrentView('main');
					}
				}
			}
		}
	};

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
			<div 
				className="ecosystem" 
				onTouchStart={handleTouchStart} 
				onTouchEnd={handleTouchEnd}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onWheel={handleWheel}
			>
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
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseLeave}
					onWheel={handleWheel}
				/>
			</div>
		);
	}

	if (currentView === 'search') {
		return (
			<div 
				className="ecosystem" 
				onTouchStart={handleTouchStart} 
				onTouchEnd={handleTouchEnd}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onWheel={handleWheel}
			>
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
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseLeave}
					onWheel={handleWheel}
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
