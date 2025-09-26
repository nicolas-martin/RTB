import QuestCard from './components/QuestCard'
import './App.css'

const mockQuests = [
	{
		id: '1',
		title: 'Complete Tutorial',
		description: 'Finish the onboarding tutorial',
		reward: 100,
		completed: false,
	},
	{
		id: '2',
		title: 'First Victory',
		description: 'Win your first game',
		reward: 250,
		completed: false,
	},
	{
		id: '3',
		title: 'Level 10',
		description: 'Reach level 10',
		reward: 500,
		completed: true,
	},
]

function App() {
	return (
		<div className="app">
			<h1>Quests</h1>
			<div className="quests-grid">
				{mockQuests.map((quest) => (
					<QuestCard key={quest.id} quest={quest} />
				))}
			</div>
		</div>
	)
}

export default App
