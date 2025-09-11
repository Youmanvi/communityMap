import React, { Suspense, lazy } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Lazy load the MapView component for better performance
const MapView = lazy(() => import('./components/MapView'));

function App() {
  return (
    <div className="App">
      <Suspense fallback={<div className="loading">Loading map...</div>}>
        <MapView />
      </Suspense>
    </div>
  );
}

export default App;
