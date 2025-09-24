import React from 'react';
import {
	Modal,
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	Platform,
	ViewStyle,
} from 'react-native';

interface RulesModalProps {
	visible: boolean;
	onClose: () => void;
}

const RULE_SECTIONS = [
	{
		title: 'Setup',
		body: 'Draw four cards face down. You will reveal each card in order by making a choice before you flip it.',
	},
	{
		title: 'Round 1 – Pick the color',
		body: 'Guess whether the next card will be red or black.',
	},
	{
		title: 'Round 2 – Higher or lower?',
		body: 'Predict if the second card will be higher or lower than the first card.',
	},
	{
		title: 'Round 3 – Inside or outside?',
		body: 'Choose whether the third card will land inside or outside the values of the first two cards.',
	},
	{
		title: 'Round 4 – Pick the suit',
		body: 'Call the suit of the final card (hearts, diamonds, clubs, or spades).',
	},
	{
		title: 'Missed a guess?',
		body: 'If you guess incorrectly, take a drink! Draw a new set of cards to play again and try to ride the bus without mistakes.',
	},
];

const cardShadow: ViewStyle = Platform.select({
	web: {
		boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.35)',
	},
	default: {
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.32,
		shadowRadius: 12,
		elevation: 12,
	},
}) as ViewStyle;

const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
	return (
		<Modal
			visible={visible}
			animationType="fade"
			transparent
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<View style={[styles.sheet, cardShadow]}>
					<Text style={styles.title}>How to Play</Text>
					<ScrollView
						contentContainerStyle={styles.content}
						showsVerticalScrollIndicator={false}
					>
						{RULE_SECTIONS.map((section) => (
							<View key={section.title} style={styles.section}>
								<Text style={styles.sectionTitle}>{section.title}</Text>
								<Text style={styles.sectionBody}>{section.body}</Text>
							</View>
						))}
					</ScrollView>
					<Pressable
						onPress={onClose}
						style={({ pressed }) => [
							styles.closeButton,
							pressed && styles.closeButtonPressed,
						]}
						accessibilityRole="button"
					>
						<Text style={styles.closeButtonText}>Got it</Text>
					</Pressable>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	sheet: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 16,
		maxHeight: '80%',
		width: '100%',
		maxWidth: 480,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: '#22303f',
		textAlign: 'center',
		marginBottom: 16,
	},
	content: {
		paddingBottom: 16,
	},
	section: {
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#22303f',
		marginBottom: 4,
	},
	sectionBody: {
		fontSize: 14,
		color: '#495057',
		lineHeight: 20,
	},
	closeButton: {
		marginTop: 8,
		alignSelf: 'center',
		paddingVertical: 10,
		paddingHorizontal: 32,
		borderRadius: 999,
		backgroundColor: '#5cb85c',
	},
	closeButtonPressed: {
		opacity: 0.85,
	},
	closeButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default RulesModal;
