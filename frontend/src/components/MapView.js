import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import FilterPanel from './FilterPanel';
import './MapView.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = () => {
  const [allResources, setAllResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [filters, setFilters] = useState({ 
    LIBRARY: true, 
    CLINIC: true, 
    FOOD_BANK: true,
    HOSPITAL: true,
    PHARMACY: true,
    SOCIAL_FACILITY: true
  });
  const [isLoadingVisible, setIsLoadingVisible] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isFilterPanelCollapsed, setIsFilterPanelCollapsed] = useState(false);
  const mapRef = useRef(null);
  
  const MAX_ENTITIES = 50;

  // Apply filters whenever filters or allResources change
  useEffect(() => {
    console.log('Applying filters - All resources:', allResources.length, 'Filters:', filters);
    const filtered = allResources.filter(resource => {
      const isIncluded = filters[resource.type] === true;
      console.log(`Resource ${resource.name} (${resource.type}): ${isIncluded ? 'SHOWN' : 'HIDDEN'}`);
      return isIncluded;
    });
    console.log('Filtered resources result:', filtered.length);
    setFilteredResources(filtered);
  }, [allResources, filters]);

  // Function to fetch resources for visible area with entity limit checking
  const fetchResourcesForBounds = useCallback(async (bounds) => {
    if (!bounds) return;
    
    try {
      setIsLoadingVisible(true);
      setMapError(null);
      
      // Calculate center and much larger radius to get more entities
      const center = bounds.getCenter();
      const radius = Math.max(
        center.distanceTo(bounds.getNorthEast()),
        center.distanceTo(bounds.getSouthWest())
      ) / 1000; // Convert to kilometers
      
      // Use a larger search radius to capture more entities
      const searchRadius = Math.max(radius * 2, 5.0); // At least 5km, or 2x the bounds radius
      
      let fetchedResources = [];
      
      // Try Overpass API first with expanded search parameters
      try {
        console.log('Fetching from Overpass API:', { 
          lat: center.lat, 
          lon: center.lng, 
          radiusKm: searchRadius 
        });
        
        // Try multiple API calls for different resource types to get more comprehensive data
        const resourceTypes = ['amenity=library', 'amenity=clinic', 'amenity=hospital', 'amenity=pharmacy', 'amenity=food_bank', 'amenity=social_facility'];
        const overpassPromises = resourceTypes.map(type => 
          axios.get('/api/resources/fetch/overpass', {
            params: {
              lat: center.lat,
              lon: center.lng,
              radiusKm: searchRadius,
              type: type,
              timeout: 10000 // 10 second timeout
            }
          }).catch(err => {
            console.warn(`Failed to fetch ${type}:`, err.message);
            return { data: [] };
          })
        );
        
        const overpassResponses = await Promise.all(overpassPromises);
        const allOverpassData = overpassResponses.flatMap(response => response.data || []);
        
        console.log('Overpass API combined response:', allOverpassData.length, 'resources');
        
        if (allOverpassData.length > 0) {
          fetchedResources = allOverpassData;
        }
      } catch (overpassError) {
        console.warn('Overpass API failed, falling back to database:', overpassError.message);
      }
      
      // If no Overpass data, fallback to database with larger radius
      if (fetchedResources.length === 0) {
        try {
          const nearbyResponse = await axios.get('/api/resources/search/nearby', {
            params: {
              lat: center.lat,
              lon: center.lng,
              dist: searchRadius * 0.621371, // Convert km to miles
              limit: MAX_ENTITIES + 10 // Fetch a bit more than limit to check for overflow
            }
          });
          
          fetchedResources = nearbyResponse.data || [];
          console.log('Database response:', fetchedResources.length, 'resources');
        } catch (dbError) {
          console.error('Database fallback failed:', dbError.message);
          throw dbError;
        }
      }
      
      // Check entity count limit
      if (fetchedResources.length > MAX_ENTITIES) {
        const errorMessage = `Too many entities found (${fetchedResources.length}). This area contains more than ${MAX_ENTITIES} resources. Please zoom in to a smaller area to reduce the number of entities.`;
        setMapError(errorMessage);
        console.warn('Entity limit exceeded:', fetchedResources.length, 'entities found');
        return;
      }
      
      // Remove duplicates based on coordinates and name
      const uniqueResources = fetchedResources.filter((resource, index, array) => 
        array.findIndex(r => 
          r.name === resource.name && 
          Math.abs(r.location.x - resource.location.x) < 0.0001 && 
          Math.abs(r.location.y - resource.location.y) < 0.0001
        ) === index
      );
      
      console.log('Setting all resources (after deduplication):', uniqueResources.length);
      setAllResources(uniqueResources);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch resources for visible area';
      setMapError(errorMessage);
      console.error('Error fetching resources for bounds:', err);
    } finally {
      setIsLoadingVisible(false);
    }
  }, []);

  const handleFilterChange = (type) => {
    console.log(`Filter change: ${type} toggled`);
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const clearAnalysis = () => {
    setAllResources([]);
    setFilteredResources([]);
    setMapError(null);
  };

  const analyzeVisibleArea = () => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      fetchResourcesForBounds(bounds);
    }
  };

  const toggleFilterPanel = () => {
    setIsFilterPanelCollapsed(!isFilterPanelCollapsed);
  };

  // Component to handle map events - no automatic updates
  const MapEvents = () => {
    return null;
  };

  // Consistent color mapping for resource types
  const getMarkerColor = (resourceType) => {
    const colorMap = {
      'LIBRARY': '#27ae60',        // Green for libraries
      'CLINIC': '#e67e22',         // Orange for clinics  
      'HOSPITAL': '#c0392b',       // Dark red for hospitals
      'PHARMACY': '#8e44ad',       // Purple for pharmacies
      'FOOD_BANK': '#f39c12',      // Golden yellow for food banks
      'SOCIAL_FACILITY': '#16a085' // Teal for social facilities
    };
    return colorMap[resourceType] || '#95a5a6'; // Default gray for unknown types
  };

  // Consistent icon mapping for resource types
  const getResourceIcon = (resourceType) => {
    const iconMap = {
      'LIBRARY': '📚',
      'CLINIC': '🏥', 
      'HOSPITAL': '🏥',
      'PHARMACY': '💊',
      'FOOD_BANK': '🍽️',
      'SOCIAL_FACILITY': '🏢'
    };
    return iconMap[resourceType] || '📍';
  };

  // Memoize marker icons to prevent unnecessary re-renders
  const markerIconCache = useRef(new Map());
  
  const getMarkerIcon = (resource) => {
    const cacheKey = resource.type;
    
    if (markerIconCache.current.has(cacheKey)) {
      return markerIconCache.current.get(cacheKey);
    }
    
    const color = getMarkerColor(resource.type);
    const icon = getResourceIcon(resource.type);
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold; cursor: pointer;">${icon}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    
    markerIconCache.current.set(cacheKey, markerIcon);
    return markerIcon;
  };

  // Format resource type for display
  const formatResourceType = (type) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="map-container">
      {/* Collapsible Filter Panel */}
      <div className={`filter-panel-container ${isFilterPanelCollapsed ? 'collapsed' : 'expanded'}`}>
        <button 
          className="filter-toggle-button"
          onClick={toggleFilterPanel}
          title={isFilterPanelCollapsed ? "Show Filters" : "Hide Filters"}
        >
          <span className={`filter-toggle-arrow ${isFilterPanelCollapsed ? 'collapsed' : 'expanded'}`}>
            {isFilterPanelCollapsed ? '▶' : '◀'}
          </span>
          {!isFilterPanelCollapsed && <span className="filter-toggle-text">Filters</span>}
        </button>
        
        <div className={`filter-panel-content ${isFilterPanelCollapsed ? 'hidden' : 'visible'}`}>
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            nearbyCount={allResources.length}
            onClearAnalysis={clearAnalysis}
            isAnalyzing={isLoadingVisible}
          />
        </div>
      </div>

      {/* Map Error Message */}
      {mapError && (
        <div className="map-error-overlay">
          <ErrorMessage error={mapError} showRetry={false} />
          <button 
            className="dismiss-error-button"
            onClick={() => setMapError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Analyze Visible Area Button */}
      <div className="analyze-button-container">
        <button 
          className={`analyze-button ${allResources.length === 0 ? 'analyze-button-pulse' : ''}`}
          onClick={analyzeVisibleArea}
          disabled={isLoadingVisible}
        >
          {isLoadingVisible ? (
            <>
              <LoadingSpinner size="small" />
              Loading Resources...
            </>
          ) : (
            <>
              <span className="analyze-icon">🔍</span>
              {allResources.length === 0 ? 'Analyze Visible Area' : 'Refresh Resources'}
            </>
          )}
        </button>
        {allResources.length === 0 && (
          <div className="analyze-hint">
            Click to load community resources for the current map view
          </div>
        )}
        {allResources.length > 0 && (
          <div className="analyze-success">
            ✓ Loaded {allResources.length} resources ({filteredResources.length} visible)
          </div>
        )}
        <div className="entity-limit-info">
          Max {MAX_ENTITIES} entities per area. Zoom in if you get an error.
        </div>
      </div>

      {/* Map */}
      <MapContainer
        ref={mapRef}
        center={[32.7767, -96.7970]} // Dallas coordinates
        zoom={12}
        style={{ height: "100vh", width: "100%" }}
      >
        <MapEvents />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render filtered resources with consistent color coding */}
        {filteredResources.map(resource => (
          <Marker 
            key={`resource-${resource.id}`} 
            position={[resource.location.y, resource.location.x]}
            icon={getMarkerIcon(resource)}
          >
            <Popup>
              <div className="popup-content">
                <h4>{resource.name}</h4>
                <p>
                  <strong>Type:</strong> 
                  <span style={{ 
                    color: getMarkerColor(resource.type), 
                    fontWeight: 'bold',
                    marginLeft: '5px'
                  }}>
                    {formatResourceType(resource.type)}
                  </span>
                </p>
                <p><strong>Address:</strong> {resource.address}</p>
                <div className="popup-actions">
                  <button 
                    className="popup-button"
                    onClick={() => window.open(`https://maps.google.com/?q=${resource.address}`, '_blank')}
                  >
                    Directions
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Additional CSS styles for the collapsible panel */}
      <style jsx>{`
        .filter-panel-container {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 1000;
          transition: all 0.3s ease;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 300px;
        }
        
        .filter-panel-container.collapsed {
          width: 50px;
        }
        
        .filter-panel-container.expanded {
          width: 280px;
        }
        
        .filter-toggle-button {
          width: 100%;
          padding: 12px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .filter-toggle-button:hover {
          background: #2980b9;
        }
        
        .filter-panel-container.collapsed .filter-toggle-button {
          border-radius: 8px;
          justify-content: center;
        }
        
        .filter-toggle-arrow {
          font-size: 12px;
          transition: transform 0.3s;
        }
        
        .filter-panel-content.hidden {
          display: none;
        }
        
        .filter-panel-content.visible {
          display: block;
          padding: 0;
        }
        
        .map-error-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2000;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          max-width: 400px;
          text-align: center;
        }
        
        .dismiss-error-button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .dismiss-error-button:hover {
          background: #c0392b;
        }
        
        .entity-limit-info {
          font-size: 11px;
          color: #7f8c8d;
          text-align: center;
          margin-top: 4px;
        }
        
        .low-results-warning {
          font-size: 11px;
          color: #e67e22;
          margin-top: 4px;
          text-align: center;
        }
        
        .filter-info {
          font-size: 10px;
          color: #7f8c8d;
          margin-top: 2px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default MapView;