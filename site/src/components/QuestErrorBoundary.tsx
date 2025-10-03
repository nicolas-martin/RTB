import React, { Component, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class QuestErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log the error to console but don't block the UI
		console.warn('[QuestErrorBoundary] Caught error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return this.props.fallback || (
				<div style={{ 
					padding: '20px', 
					textAlign: 'center', 
					color: '#666',
					fontSize: '14px'
				}}>
					Quest system temporarily unavailable. Please refresh the page.
				</div>
			);
		}

		return this.props.children;
	}
}

