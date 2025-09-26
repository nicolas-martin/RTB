import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);

		// You can log the error to an error reporting service here
		if (__DEV__) {
			console.error('Error details:', errorInfo.componentStack);
		}
	}

	resetError = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.resetError);
			}

			return (
				<View style={styles.container}>
					<View style={styles.errorCard}>
						<Text style={styles.errorTitle}>Oops! Something went wrong</Text>
						<Text style={styles.errorMessage}>
							{this.state.error.message || 'An unexpected error occurred'}
						</Text>
						{__DEV__ && (
							<Text style={styles.errorStack}>
								{this.state.error.stack?.slice(0, 200)}...
							</Text>
						)}
						<TouchableOpacity
							style={styles.resetButton}
							onPress={this.resetError}
						>
							<Text style={styles.resetButtonText}>Try Again</Text>
						</TouchableOpacity>
					</View>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#22303f',
		padding: 20,
	},
	errorCard: {
		backgroundColor: 'white',
		borderRadius: 10,
		padding: 20,
		width: '100%',
		maxWidth: 400,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#dc3545',
		marginBottom: 10,
		textAlign: 'center',
	},
	errorMessage: {
		fontSize: 16,
		color: '#333',
		marginBottom: 15,
		textAlign: 'center',
	},
	errorStack: {
		fontSize: 12,
		color: '#666',
		fontFamily: 'monospace',
		marginBottom: 15,
		padding: 10,
		backgroundColor: '#f5f5f5',
		borderRadius: 5,
	},
	resetButton: {
		backgroundColor: '#5cb85c',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 5,
		alignItems: 'center',
	},
	resetButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});

export default ErrorBoundary;
