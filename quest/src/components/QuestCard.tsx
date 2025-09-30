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

		if (quest.progress !== undefined && (quest.type === 'progress' || quest.type === 'custom')) {
			const current = Math.round(quest.progress)
			let target = 100

			// For progress quests, get target from conditions
			if (quest.type === 'progress') {
				target = quest.conditions?.[0]?.value || 100
				target = typeof target === 'number' ? target : parseFloat(target as string) || 100
			}
			// For custom quests, get target from type params (first param is usually the target)
			else if (quest.type === 'custom') {
				// For now, assume 100 USD as default target (human-readable value)
				// TODO: Extract target from quest config when available
				target = 100
			}

			const percentage = (quest.progress / target) * 100
			return (
				<div className="progress-bar">
					<div className="progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
					<span className="progress-text">{current.toLocaleString()}/{target.toLocaleString()}</span>
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
