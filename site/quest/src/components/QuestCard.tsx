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

			if (quest.type === 'progress') {
				const rawTarget = quest.conditions?.[0]?.value
				if (typeof rawTarget === 'number') {
					target = rawTarget
				} else if (typeof rawTarget === 'string') {
					const parsed = Number(rawTarget)
					if (!Number.isNaN(parsed)) {
						target = parsed
					}
				}
			}

			const safeTarget = target > 0 ? target : 100
			const percentage = safeTarget > 0 ? (quest.progress / safeTarget) * 100 : 0
			return (
				<div className="progress-bar">
					<div className="progress-fill" style={{ width: `${Math.min(percentage, 100)}%` }} />
					<span className="progress-text">{current.toLocaleString()}/{safeTarget.toLocaleString()}</span>
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
