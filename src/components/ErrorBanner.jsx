import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ErrorBanner({ gameError, setGameError }) {
  if (!gameError) return null;

  return (
    <div className="error-banner-container">
      <div className="error-banner">
        <AlertTriangle className="error-banner-icon animate-bounce" />
        <div className="error-banner-text">
          <span className="error-banner-title">API Connection Failed:</span> {gameError}
        </div>
        <button className="error-banner-close" onClick={() => setGameError(null)}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
