import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Quest } from '../types/quest';

interface QuestCardProps {
	quest: Quest;
	onPress?: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onPress }) => {
	const progressPercentage = quest.progress ?? 0;
	const isCompleted = quest.completed;

	return (
		<Pressable
			style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
			onPress={onPress}
			disabled={!onPress}
		>
			<View style={styles.header}>
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{quest.title}</Text>
					{isCompleted && (
						<Text style={styles.completedBadge}>✓ Completed</Text>
					)}
				</View>
				<View style={styles.rewardContainer}>
					<Text style={styles.rewardText}>
						{quest.reward.toLocaleString()} Points
					</Text>
				</View>
			</View>

			<Text style={styles.description}>{quest.description}</Text>

			{quest.type === 'progress' && !isCompleted && (
				<View style={styles.progressContainer}>
					<View style={styles.progressBarBackground}>
						<View
							style={[
								styles.progressBarFill,
								{ width: `${Math.min(progressPercentage, 100)}%` },
							]}
						/>
					</View>
					<Text style={styles.progressText}>
						{Math.round(progressPercentage)}%
					</Text>
				</View>
			)}

			{quest.type === 'sequential' && !isCompleted && (
				<View style={styles.progressContainer}>
					<View style={styles.progressBarBackground}>
						<View
							style={[
								styles.progressBarFill,
								{ width: `${Math.min(progressPercentage, 100)}%` },
							]}
						/>
					</View>
					<Text style={styles.progressText}>
						{quest.sequenceCondition?.sequenceLength
							? `${Math.round((progressPercentage / 100) * quest.sequenceCondition.sequenceLength)}/${quest.sequenceCondition.sequenceLength}`
							: `${Math.round(progressPercentage)}%`}
					</Text>
				</View>
			)}

			<View style={styles.footer}>
				<Text style={styles.typeLabel}>{quest.type.toUpperCase()}</Text>
				{quest.startDate && quest.endDate && (
					<Text style={styles.dateText}>
						{new Date(quest.startDate).toLocaleDateString()} -{' '}
						{new Date(quest.endDate).toLocaleDateString()}
					</Text>
				)}
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#1e1e2e',
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: '#2a2a3e',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	cardPressed: {
		transform: [{ scale: 0.98 }],
		opacity: 0.9,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	titleContainer: {
		flex: 1,
		marginRight: 12,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#ffffff',
		marginBottom: 4,
	},
	completedBadge: {
		fontSize: 12,
		color: '#4ade80',
		fontWeight: '600',
	},
	rewardContainer: {
		backgroundColor: '#fbbf24',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	rewardText: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#1e1e2e',
	},
	description: {
		fontSize: 14,
		color: '#a0a0b0',
		lineHeight: 20,
		marginBottom: 16,
	},
	progressContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	progressBarBackground: {
		flex: 1,
		height: 8,
		backgroundColor: '#2a2a3e',
		borderRadius: 4,
		overflow: 'hidden',
		marginRight: 12,
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#3b82f6',
		borderRadius: 4,
	},
	progressText: {
		fontSize: 12,
		color: '#ffffff',
		fontWeight: '600',
		minWidth: 45,
		textAlign: 'right',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	typeLabel: {
		fontSize: 11,
		fontWeight: '600',
		color: '#6366f1',
		backgroundColor: '#2a2a3e',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	dateText: {
		fontSize: 11,
		color: '#707080',
	},
});

export default QuestCard;
