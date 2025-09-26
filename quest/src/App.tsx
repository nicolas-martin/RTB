import { useState, useEffect } from 'react'
import QuestCard from './components/QuestCard'
import { createQuestService } from './services/questService'
import { Quest } from './types/quest'
import './App.css'

const questService = createQuestService()

function App() {
	const [quests, setQuests] = useState<Quest[]>([])
	const [loading, setLoading] = useState(true)

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

	if (loading) {
		return <div className="app">Loading quests...</div>
	}

	return (
		<div className="app">
			<h1>Quests</h1>
			<div className="quests-grid">
				{quests.map((quest) => (
					<QuestCard key={quest.id} quest={quest} />
				))}
			</div>
		</div>
	)
}

export default App
