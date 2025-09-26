import { Quest } from '../types/quest'
import './QuestCard.css'

interface QuestCardProps {
	quest: Quest
}

function QuestCard({ quest }: QuestCardProps) {
	const renderProgress = () => {
		if (quest.completed) {
			return <span className="status completed">✓ Completed</span>
		}

		if (quest.progress !== undefined && quest.type === 'progress') {
			const current = Math.round(quest.progress)
			const target = quest.conditions?.[0]?.value || 100
			const targetNum = typeof target === 'number' ? target : parseFloat(target as string) || 100
			const percentage = (quest.progress / targetNum) * 100
			return (
				<div className="progress-bar">
					<div className="progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
					<span className="progress-text">{current}/{targetNum}</span>
				</div>
			)
		}

		return null
	}

	return (
		<div className={`quest-card ${quest.completed ? 'completed' : ''}`}>
			<div className="quest-type">{quest.type.toUpperCase()}</div>
			<h3>{quest.title}</h3>
			<p>{quest.description}</p>
			{renderProgress()}
			<div className="quest-footer">
				<span className="reward">🪙 {quest.reward}</span>
			</div>
		</div>
	)
}

export default QuestCard
