import { useState, useEffect } from 'react'
import QuestCard from './components/QuestCard'
import { createQuestService } from './services/questService'
import { Quest } from './types/quest'
import './App.css'

const questService = createQuestService()

function App() {
	const [quests, setQuests] = useState<Quest[]>([])
	const [loading, setLoading] = useState(true)
	const [playerId, setPlayerId] = useState('')
	const [checking, setChecking] = useState(false)

	useEffect(() => {
		async function loadQuests() {
			try {
				const response = await fetch('/rtb/project.toml')
				const tomlContent = await response.text()
				await questService.loadProject(tomlContent)
				setQuests(questService.getQuestsWithProgress())

				const params = new URLSearchParams(window.location.search)
				const walletFromUrl = params.get('wallet')
				if (walletFromUrl) {
					setPlayerId(walletFromUrl)
					checkProgress(walletFromUrl)
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
			const updatedQuests = await questService.checkAllQuests(wallet)
			setQuests(updatedQuests)
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
			<div className="quests-grid">
				{quests.map((quest) => (
					<QuestCard key={quest.id} quest={quest} />
				))}
			</div>
		</div>
	)
}

export default App
