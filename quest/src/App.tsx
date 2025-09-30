import { useState, useEffect } from 'react'
import QuestCard from './components/QuestCard'
import { projectManager } from './services/projectManager'
import { Quest, ProjectMetadata } from './types/quest'
import { useMetaMask } from './hooks/useMetaMask'
import './App.css'

function App() {
	const [projectQuests, setProjectQuests] = useState<{ project: ProjectMetadata; quests: Quest[] }[]>([])
	const [loading, setLoading] = useState(true)
	const [userPoints, setUserPoints] = useState<Map<string, number>>(new Map())
	const { account, isConnected, isConnecting, error, connectWallet, disconnectWallet } = useMetaMask()

	useEffect(() => {
		async function loadQuests() {
			try {
				await projectManager.loadAllProjects()

				const params = new URLSearchParams(window.location.search)
				const walletFromUrl = params.get('wallet')
				if (walletFromUrl) {
					await checkProgress(walletFromUrl)
				} else {
					setProjectQuests(projectManager.getAllQuests())
				}
			} catch (error) {
				console.error('Failed to load quests:', error)
			} finally {
				setLoading(false)
			}
		}
		loadQuests()
	}, [])

	// Auto-check progress when wallet connects, or reset when disconnected
	useEffect(() => {
		if (isConnected && account) {
			const url = new URL(window.location.href)
			url.searchParams.set('wallet', account)
			window.history.pushState({}, '', url)
			checkProgress(account)
		} else if (!isConnected && !account) {
			// Clear all cached progress and reset to fresh quests
			projectManager.clearAllProgress()
			setProjectQuests(projectManager.getAllQuests())
			setUserPoints(new Map())
		}
	}, [isConnected, account])

	const checkProgress = async (wallet: string) => {
		if (!wallet.trim()) return
		try {
			const updatedProjectQuests = await projectManager.checkAllProjectsProgress(wallet)
			setProjectQuests(updatedProjectQuests)

			// Fetch user points for each project
			const points = await projectManager.getAllUserPoints(wallet)
			setUserPoints(points)
		} catch (error) {
			console.error('Failed to check quest progress:', error)
		}
	}

	const handleConnectWallet = async () => {
		await connectWallet()
	}

	const handleDisconnectWallet = async () => {
		await disconnectWallet()
		// Clear URL parameter
		const url = new URL(window.location.href)
		url.searchParams.delete('wallet')
		window.history.pushState({}, '', url)
		// Clear all cached progress and reset to fresh quests
		projectManager.clearAllProgress()
		setProjectQuests(projectManager.getAllQuests())
		setUserPoints(new Map())
	}

	const handleAddPlasma = async () => {
		if (!window.ethereum) {
			return
		}

		try {
			await window.ethereum.request({
				method: 'wallet_addEthereumChain',
				params: [{
					chainId: '0x2611',
					iconUrls: [
						"https://cdn.prod.website-files.com/68762d4ac364502c1ae1924b/68a48eae628be8bf1eb6b0a6_Plasma_logo_black_32x32.png",
					],
					chainName: 'Plasma Mainnet',
					nativeCurrency: {
						name: 'XPL',
						symbol: 'XPL',
						decimals: 18
					},
					rpcUrls: ['https://rpc.plasma.to'],
					blockExplorerUrls: ['https://plasmascan.to/']
				}]
			})
		} catch (error: any) {
			console.error('Failed to add Plasma network:', error)
			alert(`Error: ${error.message || 'Failed to add network'}`)
		}
	}

	return (
		<div className="app">
			<h1>Quests</h1>
			<div className="player-input">
				{!isConnected ? (
					<>
						<button onClick={handleConnectWallet} disabled={isConnecting}>
							{isConnecting ? 'Connecting...' : 'Connect Wallet'}
						</button>
						{error && <p className="error">{error}</p>}
					</>
				) : (
					<>
						<div className="wallet-info">
							<span>Connected: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}</span>
							<button onClick={handleDisconnectWallet}>Disconnect</button>
						</div>
					</>
				)}
			</div>
			<button className="add-plasma-button" onClick={handleAddPlasma}>
				<img src="/Plasma_logo_black_32x32.png" alt="Plasma" className="plasma-icon" />
				Add Plasma
			</button>
			{loading ? (
				<div className="loading-message">Loading quests...</div>
			) : (
				projectQuests.map(({ project, quests }) => {
					const projectPoints = userPoints.get(project.id) || 0
					const completedCount = quests.filter(q => q.completed).length
					const totalRewards = quests.reduce((sum, q) => sum + q.reward, 0)

					return (
						<div key={project.id} className="project-section">
							<div className="project-header">
								<div>
									<h2>{project.name}</h2>
									<p>{project.description}</p>
								</div>
								{isConnected && account && (
									<div className="project-stats">
										<div className="stat">
											<span className="stat-label">Completed</span>
											<span className="stat-value">{completedCount}/{quests.length}</span>
										</div>
										<div className="stat">
											<span className="stat-label">Your Points</span>
											<span className="stat-value">{projectPoints.toLocaleString()}</span>
										</div>
										<div className="stat">
											<span className="stat-label">Total Available</span>
											<span className="stat-value">{totalRewards.toLocaleString()}</span>
										</div>
									</div>
								)}
							</div>
							<div className="quests-grid">
								{quests.map((quest) => (
									<QuestCard key={`${project.id}-${quest.id}`} quest={quest} />
								))}
							</div>
						</div>
					)
				})
			)}
		</div>
	)
}

export default App
