import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Caught error:', error, info);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', padding: '40px 20px',
                    textAlign: 'center', fontFamily: 'Nunito, sans-serif'
                }}>
                    <div style={{ fontSize: 72, marginBottom: 16 }}>🐄💨</div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a3c28', marginBottom: 8 }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: 24, maxWidth: 400 }}>
                        {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            padding: '12px 28px', background: '#1a7a3c', color: 'white',
                            border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 15,
                            cursor: 'pointer', fontFamily: 'Nunito, sans-serif'
                        }}
                    >
                        🔄 Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
