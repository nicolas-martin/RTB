import { useState, useEffect } from 'react'
import QuestCard from './components/QuestCard'
import { projectManager } from './services/projectManager'
import { Quest, ProjectMetadata } from './types/quest'
import './App.css'

function App() {
	const [projectQuests, setProjectQuests] = useState<{ project: ProjectMetadata; quests: Quest[] }[]>([])
	const [loading, setLoading] = useState(true)
	const [playerId, setPlayerId] = useState('')
	const [checking, setChecking] = useState(false)

	useEffect(() => {
		async function loadQuests() {
			try {
				await projectManager.loadAllProjects()

				const params = new URLSearchParams(window.location.search)
				const walletFromUrl = params.get('wallet')
				if (walletFromUrl) {
					setPlayerId(walletFromUrl)
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

	const checkProgress = async (wallet: string) => {
		if (!wallet.trim()) return
		setChecking(true)
		try {
			const updatedProjectQuests = await projectManager.checkAllProjectsProgress(wallet)
			setProjectQuests(updatedProjectQuests)
		} catch (error) {
			console.error('Failed to check quest progress:', error)
		} finally {
			setChecking(false)
		}
	}

	const handleCheckProgress = async () => {
		if (!playerId.trim()) return
		const url = new URL(window.location.href)
		url.searchParams.set('wallet', playerId)
		window.history.pushState({}, '', url)
		await checkProgress(playerId)
	}

	if (loading) {
		return <div className="app">Loading quests...</div>
	}

	return (
		<div className="app">
			<h1>Quests</h1>
			<div className="player-input">
				<input
					type="text"
					placeholder="Enter player ID (wallet address)"
					value={playerId}
					onChange={(e) => setPlayerId(e.target.value)}
				/>
				<button onClick={handleCheckProgress} disabled={checking || !playerId.trim()}>
					{checking ? 'Checking...' : 'Check Progress'}
				</button>
			</div>
			{projectQuests.map(({ project, quests }) => (
				<div key={project.id} className="project-section">
					<h2>{project.name}</h2>
					<p>{project.description}</p>
					<div className="quests-grid">
						{quests.map((quest) => (
							<QuestCard key={`${project.id}-${quest.id}`} quest={quest} />
						))}
					</div>
				</div>
			))}
		</div>
	)
}

export default App
