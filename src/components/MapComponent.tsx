import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { generateClient } from 'aws-amplify/data';
import { useStationsStore } from '../store/stationsStore';

let client: any = null;
try {
  client = generateClient();
} catch (error) {
  console.warn('Amplify client not ready:', error);
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map events
function MapEventHandler() {
  const { setLoading, setStations, setError, setLoadingProgress } = useStationsStore();
  const lastFetchRef = useRef<{ lat: number; lng: number; zoom: number; radius: number } | null>(null);

  // Calculate map bounds radius in meters
  const calculateMapRadius = (map: any): number => {
    const bounds = map.getBounds();
    const center = map.getCenter();
    const corner = bounds.getNorthEast();
    
    // Calculate distance from center to corner (diagonal)
    const radius = center.distanceTo(corner);
    
    console.log(`Map radius: ${Math.round(radius)}m`);
    return Math.round(radius);
  };

  const fetchNearbyStations = useCallback(async (map: any) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const lat = center.lat;
    const lng = center.lng;
    // Validate parameters before making the request
    if (typeof lat !== 'number' || typeof lng !== 'number' || typeof zoom !== 'number') {
      console.warn('Invalid parameters for fetchNearbyStations:', { lat, lng, zoom });
      return;
    }

    if (isNaN(lat) || isNaN(lng) || isNaN(zoom)) {
      console.warn('NaN parameters detected:', { lat, lng, zoom });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Invalid coordinates:', { lat, lng });
      return;
    }

    if (zoom < 1 || zoom > 20) {
      console.warn('Invalid zoom level:', zoom);
      return;
    }

    const radius = calculateMapRadius(map);
    
    // Avoid duplicate requests
    const lastFetch = lastFetchRef.current;
    if (lastFetch && 
        Math.abs(lastFetch.lat - lat) < 0.001 && 
        Math.abs(lastFetch.lng - lng) < 0.001 && 
        lastFetch.zoom === zoom &&
        Math.abs(lastFetch.radius - radius) < 100) { // Allow 100m difference
      console.log('Skipping duplicate fetch request');
      return;
    }

    lastFetchRef.current = { lat, lng, zoom, radius };

    if (!client) {
      setError('Amplify client not configured');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Simulate progressive loading
      const progressSteps = [20, 40, 60, 80];
      let currentStep = 0;
      
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setLoadingProgress(progressSteps[currentStep]);
          currentStep++;
        }
      }, 150);
      
      const response = await client.queries.getNearStations({
        latitude: lat,
        longitude: lng,
        distance: radius,
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);
          
      if (response.data) {
        setStations(response.data);
      } else if (response.errors) {
        setError(response.errors[0]?.message || 'Failed to fetch stations');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setTimeout(() => setLoading(false), 200); // Small delay to show 100%
    }
  }, [setLoading, setStations, setError, setLoadingProgress]);

  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      fetchNearbyStations(map);
    },
    zoomend: (e) => {
      const map = e.target;
      fetchNearbyStations(map);
    },
  });

  return null;
}

interface MapComponentProps {
  className?: string;
}

export default function MapComponent({ className = '' }: MapComponentProps) {
  const { stations, loading, loadingProgress, selectedStationId, setSelectedStation } = useStationsStore();
  
  const positionRef = useRef<[number, number]>([-23.5505, -46.6333]); // São Paulo
  const initialPosition = positionRef.current;

  return (
    <div className={`${className} rounded-lg overflow-hidden relative`} style={{ height: '100%' }}>
      {loading && (
        <div className="fixed bottom-0 left-0 right-0 z-[1000]">
          <div className="h-2 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-500 ease-out"
              style={{ 
                width: `${loadingProgress}%`,
                boxShadow: '0 -3px 10px rgba(100, 255, 150, 0.9), 0 -6px 15px rgba(100, 255, 150, 0.6)'
              }}
            />
          </div>
        </div>
      )}
      
      <MapContainer
        center={initialPosition}
        zoom={13}
        className="h-full w-full"
        style={{ height: '100%', minHeight: '400px' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Map event handler */}
        <MapEventHandler />
        
        {/* Render stations from store */}
        {stations
          .filter(station => 
            station.coordinates && 
            Array.isArray(station.coordinates) &&
            station.coordinates.length === 2 &&
            typeof station.coordinates[0] === 'number' &&
            typeof station.coordinates[1] === 'number' &&
            !isNaN(station.coordinates[0]) &&
            !isNaN(station.coordinates[1]) &&
            station.coordinates[0] >= -90 &&
            station.coordinates[0] <= 90 &&
            station.coordinates[1] >= -180 &&
            station.coordinates[1] <= 180
          )
          .map((station) => (
            <Marker 
              key={station.id} 
              position={station.coordinates}
              eventHandlers={{
                click: () => {
                  setSelectedStation(station.id);
                }
              }}
            />
          ))}
      </MapContainer>
    </div>
  );
}