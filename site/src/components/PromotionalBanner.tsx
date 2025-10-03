import { useState, useEffect } from 'react';
import './PromotionalBanner.css';

interface FeaturedApp {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaUrl: string;
    backgroundImage?: string; // full-bleed image
    backgroundColor?: string;
    coverImage?: string; // cover image for banner
}

const featuredApps: FeaturedApp[] = [
	{
		id: '1',
		title: 'AAVE',
		subtitle: 'DeFi • Lending',
		description: 'The world\'s largest decentralized liquidity protocol for crypto markets.',
		ctaText: 'Visit Site',
		ctaUrl: 'https://aave.com/',
        backgroundColor: '#1a1430',
        backgroundImage: '/icons/aave.svg',
        coverImage: '/covers/aave_cover.jpeg'
	},
	{
		id: '2',
		title: 'STARGATE',
		subtitle: 'DeFi • Bridge',
		description: 'Omnichain liquidity transport protocol for seamless cross-chain transfers.',
		ctaText: 'Bridge Now',
		ctaUrl: 'https://stargate.finance/',
        backgroundColor: '#1a1a2e',
        backgroundImage: '/icons/stargate.svg',
        coverImage: '/covers/stargate_cover.jpeg'
	},
	{
		id: '3',
		title: 'CURVE',
		subtitle: 'DeFi • DEX',
		description: 'Leading decentralized exchange for stablecoin and token swaps with low slippage.',
		ctaText: 'Trade Now',
		ctaUrl: 'https://curve.fi/',
        backgroundColor: '#0b1320',
        backgroundImage: '/icons/curve.svg',
        coverImage: '/covers/curve_cover.jpeg'
	},
	{
		id: '4',
		title: 'VEDA',
		subtitle: 'DeFi • Analytics',
		description: 'Advanced analytics and insights for decentralized finance protocols.',
		ctaText: 'Explore',
		ctaUrl: 'https://veda.xyz/',
        backgroundColor: '#0f2b23',
        backgroundImage: '/icons/veda.svg',
        coverImage: '/covers/veda_cover.jpeg'
	},
	{
		id: '5',
		title: 'METAMASK',
		subtitle: 'Wallet • Infrastructure',
		description: 'The most trusted and widely used crypto wallet for Web3 applications.',
		ctaText: 'Get Started',
		ctaUrl: 'https://metamask.io/',
        backgroundColor: '#1a1a2e',
        backgroundImage: '/icons/metamask.svg',
        coverImage: '/covers/metamask_cover.jpeg'
	}
];

export default function PromotionalBanner() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);

	// Auto-advance slides every 5 seconds
	useEffect(() => {
		if (!isAutoPlaying) return;
		
		const interval = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % featuredApps.length);
		}, 5000);

		return () => clearInterval(interval);
	}, [isAutoPlaying]);

	const goToPrevious = () => {
		setIsAutoPlaying(false);
		setCurrentIndex((prev) => (prev - 1 + featuredApps.length) % featuredApps.length);
		setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
	};

	const goToNext = () => {
		setIsAutoPlaying(false);
		setCurrentIndex((prev) => (prev + 1) % featuredApps.length);
		setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
	};

	const goToSlide = (index: number) => {
		setIsAutoPlaying(false);
		setCurrentIndex(index);
		setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
	};

    const currentApp = featuredApps[currentIndex];
    const art = currentApp.coverImage || currentApp.backgroundImage;

    return (
        <div className="promo-wrap">
            <div aria-hidden className="promo-ambient-shadow" />
            <section className="promotional-banner" style={{ backgroundColor: currentApp.backgroundColor }}>
                {/* Background image and overlays */}
                <div className="banner-bg" aria-hidden>
                    <div className="bg-overlay-top" />
                    <div className="bg-overlay-right" />
                    {art && (
                        <img
                            src={art}
                            alt=""
                            className="bg-image cover"
                            loading="eager"
                        />
                    )}
                </div>

                {/* Animated copy block */}
                <div key={currentApp.id} className="banner-copy">
                    <div className="copy-inner">
                        <h1 className="banner-title">{currentApp.title}</h1>
                        <p className="banner-description">{currentApp.description}</p>
                        <div className="banner-actions">
                            <a
                                href={currentApp.ctaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cta-button"
                                aria-label={`Open ${currentApp.title} website in a new tab`}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                                </svg>
                                {currentApp.ctaText}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Arrows */}
                <button onClick={goToPrevious} className="chev chev-left" aria-label="Previous">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button onClick={goToNext} className="chev chev-right" aria-label="Next">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Dots */}
                <div className="banner-indicators">
                    {featuredApps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`indicator ${i === currentIndex ? 'active' : ''}`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
