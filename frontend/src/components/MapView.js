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
      const radius = Math.max(
        center.distanceTo(bounds.getNorthEast()),
        center.distanceTo(bounds.getSouthWest())
      ) / 1000; // Convert to kilometers
      
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

  // Debounced function to fetch resources when map moves
  const debouncedFetchResources = useCallback((bounds) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchResourcesForBounds(bounds);
    }, 1000); // 1 second debounce
  }, [fetchResourcesForBounds]);

  // Fetch all resources on component mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/resources');
        setResources(response.data);
        setFilteredResources(response.data);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load resources';
        setError(errorMessage);
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filter resources based on active filters
  useEffect(() => {
    const filtered = resources.filter(resource => 
      filters[resource.type]
    );
    setFilteredResources(filtered);
  }, [resources, filters]);

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
        const bounds = e.target.getBounds();
        setMapBounds(bounds);
        // Clear visible resources when map moves to show fresh data
        setVisibleResources([]);
        debouncedFetchResources(bounds);
      },
      zoomend: (e) => {
        const bounds = e.target.getBounds();
        setMapBounds(bounds);
        // Clear visible resources when map zooms to show fresh data
        setVisibleResources([]);
        debouncedFetchResources(bounds);
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

  const getMarkerColor = (resource) => {
    if (nearbyResources.some(nr => nr.id === resource.id)) {
      return '#dc3545'; // Red for nearby resources
    }
    if (visibleResources.some(vr => vr.id === resource.id)) {
      return '#17a2b8'; // Cyan for visible area resources
    }
    // Different colors for different resource types
    switch (resource.type) {
      case 'LIBRARY': return '#28a745';
      case 'CLINIC': return '#007bff';
      case 'FOOD_BANK': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getMarkerIcon = (resource) => {
    const color = getMarkerColor(resource);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">${resource.type.charAt(0)}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
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

      {/* Analyze Button */}
      <div className="analyze-button-container">
        <button 
          className="analyze-button"
          onClick={analyzeVisibleArea}
          disabled={isLoadingVisible}
        >
          {isLoadingVisible ? (
            <>
              <LoadingSpinner size="small" />
              Analyzing...
            </>
          ) : (
            'Analyze Visible Area'
          )}
        </button>
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
        
        {/* Render resources - show visible area resources if available, otherwise show filtered resources */}
        {(visibleResources.length > 0 ? visibleResources : filteredResources).map(resource => (
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

      {/* Resource Count Display */}
      <div className="resource-count">
        Showing {visibleResources.length > 0 ? visibleResources.length : filteredResources.length} resources
        {visibleResources.length > 0 && (
          <span className="visible-count">
            • Live data from visible area
          </span>
        )}
      </div>
    </div>
  );
};

export default MapView;
