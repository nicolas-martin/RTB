import { useEffect, useRef, useState } from 'react';
import { useQuestData } from './QuestDataProvider';
import './QuestTopBarStats.css';

export default function QuestTopBarStats() {
	const {
		projectQuests,
		totals,
		userPoints,
		account,
		isConnected,
		isConnecting,
		handleConnect,
		error,
	} = useQuestData();

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
				<span className="topbar-value">{totals.points.toLocaleString()}</span>
			</div>
			<div className="topbar-item">
				<span className="topbar-label">Completion</span>
				<span className="topbar-meta">{totals.completed}/{totals.totalQuests}</span>
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
