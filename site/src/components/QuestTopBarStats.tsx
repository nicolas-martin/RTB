import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuestData } from './QuestDataProvider';
import { useQuestProgressStore } from '@quest-src/stores/questProgressStore';
import './QuestTopBarStats.css';

export default function QuestTopBarStats() {
	const {
		account,
		isConnected,
		isConnecting,
		handleConnect,
		error,
	} = useQuestData();

	// Get global stats from store (not filtered by project)
	const globalProjectQuests = useQuestProgressStore((state) => state.globalProjectQuests);
	const globalUserPoints = useQuestProgressStore((state) => state.globalUserPoints);

	// Calculate global totals
	const globalTotals = useMemo(() => {
		const totalQuests = globalProjectQuests.reduce((acc, item) => acc + item.quests.length, 0);
		const completed = globalProjectQuests.reduce(
			(acc, item) => acc + item.quests.filter((quest) => quest.completed).length,
			0
		);
		const points = Array.from(globalUserPoints.values()).reduce((acc, value) => acc + value, 0);

		return {
			totalQuests,
			completed,
			completionPct: totalQuests ? Math.round((completed / totalQuests) * 100) : 0,
			points,
		};
	}, [globalProjectQuests, globalUserPoints]);

	const formattedAccount = isConnected && account ? `${account.slice(0, 6)}…${account.slice(-4)}` : '';
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const buttonRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
				return;
			}
			setMenuOpen(false);
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [menuOpen]);

	useEffect(() => {
		if (!isConnected) {
			setMenuOpen(false);
		}
	}, [isConnected]);

	const handleWalletButton = async () => {
		if (isConnecting) return;
		if (!isConnected) {
			await handleConnect();
			return;
		}
		setMenuOpen((open) => !open);
	};

	const handleDisconnect = async () => {
		await handleConnect();
		setMenuOpen(false);
	};

	return (
		<div className="topbar-stats" role="presentation">
			<div className="topbar-item">
				<span className="topbar-label">Points</span>
				<span className="topbar-value">{globalTotals.points.toLocaleString()}</span>
			</div>
			<div className="topbar-item">
				<span className="topbar-label">Completion</span>
				<span className="topbar-meta">{globalTotals.completed}/{globalTotals.totalQuests}</span>
			</div>
			<div className="topbar-wallet-shell" ref={menuRef}>
				<button
					className="topbar-wallet-button"
					onClick={handleWalletButton}
					disabled={isConnecting}
					ref={buttonRef}
				>
					{isConnecting
						? 'Connecting…'
						: isConnected
							? formattedAccount || 'Wallet'
							: 'Connect Wallet'}
				</button>
				{menuOpen && (
					<div className="topbar-wallet-menu">
						<button type="button" onClick={handleDisconnect}>
							Disconnect
						</button>
					</div>
				)}
			</div>
			{error && <span className="topbar-error">{error}</span>}
		</div>
	);
}
