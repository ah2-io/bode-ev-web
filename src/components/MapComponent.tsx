import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useEffect, useCallback, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { generateClient } from 'aws-amplify/data';
import { useStationsStore } from '../store/stationsStore';
import LocationButton from './LocationButton';
import StationMarker from './StationMarker';

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

// User location icon
const userLocationIcon = new L.Icon({
  iconUrl: '/user-location.png',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -12],
});

// Types for region management
interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface FetchRegion extends MapBounds {
  timestamp: number;
}

// Utility functions for region calculations
const calculateBoundsFromCenter = (lat: number, lng: number, radius: number): MapBounds => {
  // Convert radius from meters to approximate degrees
  const latDegreePerMeter = 1 / 111320;
  const lngDegreePerMeter = 1 / (111320 * Math.cos(lat * Math.PI / 180));
  
  const latOffset = radius * latDegreePerMeter;
  const lngOffset = radius * lngDegreePerMeter;
  
  return {
    north: lat + latOffset,
    south: lat - latOffset,
    east: lng + lngOffset,
    west: lng - lngOffset,
  };
};

const calculateIntersectionArea = (region1: MapBounds, region2: MapBounds): number => {
  const intersectionNorth = Math.min(region1.north, region2.north);
  const intersectionSouth = Math.max(region1.south, region2.south);
  const intersectionEast = Math.min(region1.east, region2.east);
  const intersectionWest = Math.max(region1.west, region2.west);
  
  if (intersectionNorth <= intersectionSouth || intersectionEast <= intersectionWest) {
    return 0; // No intersection
  }
  
  return (intersectionNorth - intersectionSouth) * (intersectionEast - intersectionWest);
};

const calculateRegionArea = (region: MapBounds): number => {
  return (region.north - region.south) * (region.east - region.west);
};

const calculateIntersectionPercentage = (currentRegion: MapBounds, existingRegion: MapBounds): number => {
  const intersectionArea = calculateIntersectionArea(currentRegion, existingRegion);
  const currentArea = calculateRegionArea(currentRegion);
  
  if (currentArea === 0) return 0;
  return (intersectionArea / currentArea) * 100;
};

// Component to handle map events
function MapEventHandler() {
  const { setLoading, setStations, setError, setLoadingProgress } = useStationsStore();
  const fetchedRegionsRef = useRef<FetchRegion[]>([]);
  const initialFetchDoneRef = useRef(false);

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
    const currentRegion = calculateBoundsFromCenter(lat, lng, radius);
    
    // Check if current region has sufficient overlap with any fetched region
    const hassufficientOverlap = fetchedRegionsRef.current.some(fetchedRegion => {
      const intersectionPercent = calculateIntersectionPercentage(currentRegion, fetchedRegion);
      return intersectionPercent >= 80;
    });
    
    if (hassufficientOverlap) {
      console.log('Skipping fetch - sufficient overlap with existing region');
      return;
    }

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
        
        // Store the successfully fetched region
        const newFetchedRegion: FetchRegion = {
          ...currentRegion,
          timestamp: Date.now(),
        };
        
        // Add to fetched regions (keep only recent ones to prevent memory leak)
        fetchedRegionsRef.current = [
          ...fetchedRegionsRef.current.slice(-9), // Keep last 9 regions
          newFetchedRegion
        ];
        
        console.log(`Stored fetched region. Total regions: ${fetchedRegionsRef.current.length}`);
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

  const map = useMapEvents({
    moveend: (e) => {
      const map = e.target;
      fetchNearbyStations(map);
    },
    zoomend: (e) => {
      const map = e.target;
      fetchNearbyStations(map);
    },
  });

  // Initial fetch when map is ready
  useEffect(() => {
    if (map && !initialFetchDoneRef.current) {
      console.log('Map ready, performing initial fetch');
      initialFetchDoneRef.current = true;
      // Small delay to ensure map is fully rendered
      setTimeout(() => {
        fetchNearbyStations(map);
      }, 500);
    }
  }, [map, fetchNearbyStations]);

  return null;
}

interface MapComponentProps {
  className?: string;
}

export default function MapComponent({ className = '' }: MapComponentProps) {
  const { stations, loading, loadingProgress, selectedStationId, setSelectedStation } = useStationsStore();
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  const positionRef = useRef<[number, number]>([-23.5505, -46.6333]); // São Paulo
  const initialPosition = positionRef.current;

  const handleLocationFound = (lat: number, lng: number) => {
    const position: [number, number] = [lat, lng];
    setUserLocation(position);
    if (mapRef.current) {
      mapRef.current.setView(position, 15);
    }
  };

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
        ref={mapRef}
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
            <StationMarker
              key={station.id}
              station={station}
              isSelected={selectedStationId === station.id}
              onClick={(station) => setSelectedStation(station.id)}
            />
          ))}

        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
                <br />
                <small>Lat: {userLocation[0].toFixed(6)}</small>
                <br />
                <small>Lng: {userLocation[1].toFixed(6)}</small>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Location Button */}
      <LocationButton 
        onLocationFound={handleLocationFound}
        className="absolute bottom-16 left-4 z-[9999]"
      />
    </div>
  );
}