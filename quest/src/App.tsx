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
				const response = await fetch('/rtb.toml')
				const tomlContent = await response.text()
				await questService.loadProject(tomlContent)
				setQuests(questService.getQuestsWithProgress())
			} catch (error) {
				console.error('Failed to load quests:', error)
			} finally {
				setLoading(false)
			}
		}
		loadQuests()
	}, [])

	const handleCheckProgress = async () => {
		if (!playerId.trim()) return
		setChecking(true)
		try {
			const updatedQuests = await questService.checkAllQuests(playerId)
			setQuests(updatedQuests)
		} catch (error) {
			console.error('Failed to check quest progress:', error)
		} finally {
			setChecking(false)
		}
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
