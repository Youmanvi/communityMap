import React from 'react';
import './FilterPanel.css';

const FilterPanel = ({ filters, onFilterChange, nearbyCount, onClearAnalysis, isAnalyzing }) => {
  return (
    <div className="filter-panel">
      <div className="panel-section">
        <h3>Filter Resources</h3>
        <div className="filter-options">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={filters.LIBRARY}
              onChange={() => onFilterChange('LIBRARY')}
            />
            <span className="filter-label">
              <span className="filter-icon">📚</span>
              Libraries
            </span>
          </label>
          <label className="filter-option">
            <input
              type="checkbox"
              checked={filters.CLINIC}
              onChange={() => onFilterChange('CLINIC')}
            />
            <span className="filter-label">
              <span className="filter-icon">🏥</span>
              Clinics
            </span>
          </label>
          <label className="filter-option">
            <input
              type="checkbox"
              checked={filters.FOOD_BANK}
              onChange={() => onFilterChange('FOOD_BANK')}
            />
            <span className="filter-label">
              <span className="filter-icon">🍽️</span>
              Food Banks
            </span>
          </label>
        </div>
      </div>
      
      <div className="panel-section">
        <h4>Analysis</h4>
        <div className="analysis-info">
          <p>Click anywhere on the map to analyze resources within 1 mile</p>
          {isAnalyzing && (
            <div className="analyzing-indicator">
              <div className="pulse-dot"></div>
              <span>Analyzing...</span>
            </div>
          )}
          {nearbyCount > 0 && (
            <div className="analysis-results">
              <p className="results-text">Found {nearbyCount} resources nearby</p>
              <button onClick={onClearAnalysis} className="clear-button">
                Clear Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
