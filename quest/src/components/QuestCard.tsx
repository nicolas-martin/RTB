import { Quest } from '../types/quest'
import './QuestCard.css'

interface QuestCardProps {
	quest: Quest
}

function QuestCard({ quest }: QuestCardProps) {
	return (
		<div className={`quest-card ${quest.completed ? 'completed' : ''}`}>
			<h3>{quest.title}</h3>
			<p>{quest.description}</p>
			<div className="quest-footer">
				<span className="reward">🪙 {quest.reward}</span>
				{quest.completed && <span className="status">✓ Completed</span>}
			</div>
		</div>
	)
}

export default QuestCard
