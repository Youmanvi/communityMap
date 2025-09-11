import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
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
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [filters, setFilters] = useState({ 
    LIBRARY: true, 
    CLINIC: true, 
    FOOD_BANK: true 
  });
  const [nearbyResources, setNearbyResources] = useState([]);
  const [searchCenter, setSearchCenter] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [visibleResources, setVisibleResources] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);
  const [isLoadingVisible, setIsLoadingVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mapRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Function to fetch resources for visible area
  const fetchResourcesForBounds = useCallback(async (bounds) => {
    if (!bounds) return;
    
    try {
      setIsLoadingVisible(true);
      setMapError(null);
      
      // Calculate center and radius from bounds
      const center = bounds.getCenter();
      const radius = Math.min(
        Math.max(
          center.distanceTo(bounds.getNorthEast()),
          center.distanceTo(bounds.getSouthWest())
        ) / 1000, // Convert to kilometers
        5.0 // Max 5km radius for performance
      );
      
      // Always try to fetch fresh data from Overpass API first
      try {
        console.log('Fetching from Overpass API:', { lat: center.lat, lon: center.lng, radiusKm: Math.max(radius, 1.6) });
        const overpassResponse = await axios.get('/api/resources/fetch/overpass', {
          params: {
            lat: center.lat,
            lon: center.lng,
            radiusKm: Math.max(radius, 1.6), // At least 1 mile
            type: 'all'
          }
        });
        
        console.log('Overpass API response:', overpassResponse.data.length, 'resources');
        
        // If Overpass returns data, use it
        if (overpassResponse.data && overpassResponse.data.length > 0) {
          setVisibleResources(overpassResponse.data);
          return;
        }
      } catch (overpassError) {
        console.warn('Overpass API failed, falling back to database:', overpassError.message);
      }
      
      // Fallback to database if Overpass fails or returns no data
      const nearbyResponse = await axios.get('/api/resources/search/nearby', {
        params: {
          lat: center.lat,
          lon: center.lng,
          dist: Math.max(radius, 1) // At least 1 mile radius
        }
      });
      
      setVisibleResources(nearbyResponse.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch resources for visible area';
      setMapError(errorMessage);
      console.error('Error fetching resources for bounds:', err);
    } finally {
      setIsLoadingVisible(false);
    }
  }, []);


  // Initialize with empty state - no automatic loading
  useEffect(() => {
    setLoading(false);
    setResources([]);
    setFilteredResources([]);
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Filter resources based on active filters
  useEffect(() => {
    // Use visible resources if available, otherwise use all resources
    const sourceResources = visibleResources.length > 0 ? visibleResources : resources;
    const filtered = sourceResources.filter(resource => 
      filters[resource.type]
    );
    setFilteredResources(filtered);
  }, [resources, visibleResources, filters]);

  const handleFilterChange = (type) => {
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleMapClick = async (e) => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setMapError(null);
    const { lat, lng } = e.latlng;
    setSearchCenter([lat, lng]);

    try {
      // First try to get nearby resources from database
      const nearbyResponse = await axios.get('/api/resources/search/nearby', {
        params: {
          lat: lat,
          lon: lng,
          dist: 1 // 1 mile radius
        }
      });
      
      // If no resources found in database, fetch from Overpass API
      if (nearbyResponse.data.length === 0) {
        const overpassResponse = await axios.get('/api/resources/fetch/overpass', {
          params: {
            lat: lat,
            lon: lng,
            radiusKm: 1.6, // ~1 mile
            type: 'all'
          }
        });
        setNearbyResources(overpassResponse.data);
      } else {
        setNearbyResources(nearbyResponse.data);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to search nearby resources';
      setMapError(errorMessage);
      console.error('Error searching nearby resources:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setNearbyResources([]);
    setSearchCenter(null);
    setMapError(null);
  };

  const analyzeVisibleArea = () => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      fetchResourcesForBounds(bounds);
    }
  };

  // Component to handle map events
  const MapEvents = () => {
    useMapEvents({
      moveend: (e) => {
        // Debounce map events to prevent excessive updates
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
          const bounds = e.target.getBounds();
          setMapBounds(bounds);
          // Clear visible resources when map moves - user must manually refresh
          setVisibleResources([]);
          setMapError(null); // Clear any previous errors
        }, 300); // 300ms debounce
      },
      zoomend: (e) => {
        // Debounce map events to prevent excessive updates
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
          const bounds = e.target.getBounds();
          setMapBounds(bounds);
          // Clear visible resources when map zooms - user must manually refresh
          setVisibleResources([]);
          setMapError(null); // Clear any previous errors
        }, 300); // 300ms debounce
      }
    });
    return null;
  };

  const retryFetchResources = () => {
    setError(null);
    setLoading(true);
    // Trigger re-fetch by updating a dependency
    setResources([]);
  };

  // Manual mode - no automatic refresh functionality

  const getMarkerColor = (resource) => {
    // Priority: nearby analysis > visible area > resource type
    if (nearbyResources.some(nr => nr.id === resource.id)) {
      return '#dc3545'; // Red for nearby analysis resources
    }
    if (visibleResources.some(vr => vr.id === resource.id)) {
      return '#17a2b8'; // Cyan for visible area resources
    }
    // Distinct colors for different resource types
    switch (resource.type) {
      case 'LIBRARY': return '#28a745'; // Green for libraries
      case 'CLINIC': return '#007bff'; // Blue for clinics
      case 'FOOD_BANK': return '#ffc107'; // Yellow for food banks
      default: return '#6c757d'; // Gray for unknown types
    }
  };

  // Memoize marker icons to prevent unnecessary re-renders
  const markerIconCache = useRef(new Map());
  
  const getMarkerIcon = (resource) => {
    const cacheKey = `${resource.type}-${getMarkerColor(resource)}`;
    
    if (markerIconCache.current.has(cacheKey)) {
      return markerIconCache.current.get(cacheKey);
    }
    
    const color = getMarkerColor(resource);
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

  const getResourceIcon = (type) => {
    switch (type) {
      case 'LIBRARY': return '📚';
      case 'CLINIC': return '🏥';
      case 'FOOD_BANK': return '🍽️';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="map-container">
        <LoadingSpinner size="large" message="Loading community resources..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <ErrorMessage error={error} onRetry={retryFetchResources} />
      </div>
    );
  }

  return (
    <div className="map-container">
      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        nearbyCount={nearbyResources.length}
        onClearAnalysis={clearAnalysis}
        isAnalyzing={isAnalyzing}
      />

      {/* Map Error Message */}
      {mapError && (
        <div className="map-error-overlay">
          <ErrorMessage error={mapError} showRetry={false} />
        </div>
      )}

      {/* Manual Update Button */}
      <div className="analyze-button-container">
        <button 
          className={`analyze-button ${visibleResources.length === 0 ? 'analyze-button-pulse' : ''}`}
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
              {visibleResources.length === 0 ? 'Load Visible Resources' : 'Refresh Resources'}
            </>
          )}
        </button>
        {visibleResources.length === 0 && (
          <div className="analyze-hint">
            Click to load community resources for the current map view
          </div>
        )}
        {visibleResources.length > 0 && (
          <div className="analyze-success">
            ✓ Loaded {visibleResources.length} resources
          </div>
        )}
      </div>

      {/* Map */}
      <MapContainer
        ref={mapRef}
        center={[32.7767, -96.7970]} // Dallas coordinates
        zoom={12}
        style={{ height: "100vh", width: "100%" }}
        onClick={handleMapClick}
      >
        <MapEvents />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render filtered resources */}
        {filteredResources.map(resource => (
          <Marker 
            key={visibleResources.length > 0 ? `visible-${resource.id}` : resource.id} 
            position={[resource.location.y, resource.location.x]}
            icon={getMarkerIcon(resource)}
          >
            <Popup>
              <div className="popup-content">
                <h4>{resource.name}</h4>
                <p><strong>Type:</strong> {resource.type.replace('_', ' ')}</p>
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

        {/* Show search radius circle */}
        {searchCenter && (
          <Circle
            center={searchCenter}
            radius={1609.34} // 1 mile in meters
            pathOptions={{ 
              color: '#dc3545', 
              fillColor: '#dc3545',
              fillOpacity: 0.1,
              weight: 2
            }}
          />
        )}
      </MapContainer>

    </div>
  );
};

export default MapView;
