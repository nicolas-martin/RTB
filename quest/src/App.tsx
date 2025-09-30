import { useState, useEffect } from 'react'
import QuestCard from './components/QuestCard'
import { projectManager } from './services/projectManager'
import { Quest, ProjectMetadata } from './types/quest'
import { useMetaMask } from './hooks/useMetaMask'
import './App.css'

function App() {
	const [projectQuests, setProjectQuests] = useState<{ project: ProjectMetadata; quests: Quest[] }[]>([])
	const [loading, setLoading] = useState(true)
	const [checking, setChecking] = useState(false)
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

	// Auto-check progress when wallet connects
	useEffect(() => {
		if (isConnected && account) {
			const url = new URL(window.location.href)
			url.searchParams.set('wallet', account)
			window.history.pushState({}, '', url)
			checkProgress(account)
		}
	}, [isConnected, account])

	const checkProgress = async (wallet: string) => {
		if (!wallet.trim()) return
		setChecking(true)
		try {
			const updatedProjectQuests = await projectManager.checkAllProjectsProgress(wallet)
			setProjectQuests(updatedProjectQuests)

			// Fetch user points for each project
			const points = await projectManager.getAllUserPoints(wallet)
			setUserPoints(points)
		} catch (error) {
			console.error('Failed to check quest progress:', error)
		} finally {
			setChecking(false)
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
		// Reset to show all quests
		setProjectQuests(projectManager.getAllQuests())
	}

	if (loading) {
		return <div className="app">Loading quests...</div>
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
						{checking && <p>Checking progress...</p>}
					</>
				)}
			</div>
			{projectQuests.map(({ project, quests }) => {
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
			})}
		</div>
	)
}

export default App
