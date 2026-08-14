// src/components/Access/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#1a1a1a] text-white p-4">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">Error en el escáner de QR</p>
            <p className="text-gray-400 text-xs">{this.state.error?.message || 'Error desconocido'}</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-3 px-4 py-1.5 bg-[#00ff88] text-black rounded-lg text-sm font-medium hover:bg-[#00cc6a] transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;