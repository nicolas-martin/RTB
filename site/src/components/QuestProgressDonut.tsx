interface QuestProgressDonutProps {
	completed: number;
	total: number;
	size?: number;
}

export default function QuestProgressDonut({
	completed,
	total,
	size = 104,
}: QuestProgressDonutProps) {
	const strokeWidth = 10;
	const radius = size / 2 - strokeWidth;
	const circumference = 2 * Math.PI * radius;
	const progress = total === 0 ? 0 : Math.min(completed / total, 1);
	const strokeDashoffset = circumference * (1 - progress);

	return (
		<svg
			className="quest-donut"
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
		>
			<circle
				className="quest-donut-track"
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={strokeWidth}
				fill="transparent"
			/>
			<circle
				className="quest-donut-progress"
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={strokeWidth}
				fill="transparent"
				strokeDasharray={circumference}
				strokeDashoffset={strokeDashoffset}
			/>
			<text x="50%" y="52%" className="quest-donut-text">
				{total === 0 ? '0%' : `${Math.round(progress * 100)}%`}
			</text>
		</svg>
	);
}

