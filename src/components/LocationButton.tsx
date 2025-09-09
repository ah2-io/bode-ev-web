import { MapPinIcon } from '@heroicons/react/24/outline';
import { useGeolocation } from '../hooks/useGeolocation';
import { useEffect, useRef } from 'react';

interface LocationButtonProps {
  onLocationFound?: (lat: number, lng: number) => void;
  className?: string;
}

export default function LocationButton({ onLocationFound, className = '' }: LocationButtonProps) {
  const { getCurrentPosition, loading, error, latitude, longitude, clearError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000,
  });
  
  const hasCalledCallback = useRef(false);

  const handleLocationClick = () => {
    clearError();
    hasCalledCallback.current = false;
    getCurrentPosition();
  };

  // Call onLocationFound when location is obtained (only once per request)
  useEffect(() => {
    if (latitude !== null && longitude !== null && onLocationFound && !hasCalledCallback.current) {
      hasCalledCallback.current = true;
      onLocationFound(latitude, longitude);
    }
  }, [latitude, longitude, onLocationFound]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleLocationClick}
        disabled={loading}
        className={`
          p-3 rounded-full shadow-xl border border-white/30 backdrop-blur-md transition-all duration-200
          ${loading 
            ? 'bg-gray-100 cursor-not-allowed shadow-lg' 
            : 'bg-white/95 hover:bg-white hover:shadow-2xl active:scale-95 shadow-xl drop-shadow-lg'
          }
        `}
        title={loading ? 'Getting location...' : 'Find my location'}
      >
        <MapPinIcon 
          className={`h-5 w-5 transition-all duration-200 ${
            loading 
              ? 'text-gray-400 animate-pulse' 
              : 'text-primary hover:text-primary-hover'
          }`} 
        />
      </button>

      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 min-w-max">
          <div className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            <div className="relative">
              {error}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}