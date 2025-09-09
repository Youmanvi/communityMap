import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ error, onRetry, showRetry = true }) => {
  if (!error) return null;

  return (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h4>Error</h4>
        <p>{error}</p>
        {showRetry && onRetry && (
          <button onClick={onRetry} className="retry-button">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
