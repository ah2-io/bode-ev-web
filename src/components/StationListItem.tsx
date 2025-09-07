import { useRef, useEffect, useState, useCallback } from 'react';
import { MapPinIcon, BoltIcon } from '@heroicons/react/24/outline';
import { useStationDetails } from '../hooks/useStationDetails';
import type { BasicStation } from '../store/stationsStore';

// Throttle function for intersection observer
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  let lastExecTime = 0;
  return (...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

interface StationListItemProps {
  station: BasicStation;
  isSelected: boolean;
  onClick: (station: BasicStation) => void;
}

export default function StationListItem({ station, isSelected, onClick }: StationListItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Only fetch details when visible
  const { details, isLoading } = useStationDetails(isVisible ? station.id : '');

  // Throttled visibility handler
  const handleIntersection = useCallback(
    throttle((entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
        console.log(`Station ${station.id} became visible`);
      }
    }, 150),
    [station.id, isVisible]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection]);

  const handleClick = () => {
    onClick(station);
  };

  return (
    <div
      ref={elementRef}
      onClick={handleClick}
      className={`p-3 bg-white rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {isLoading ? (
        // Loading skeleton
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ) : isVisible && details ? (
        // Full details
        <>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-gray-900 text-sm">{details.name}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPinIcon className="h-3 w-3 mr-1" />
                {details.address}
              </div>
            </div>
          </div>

          <div className="flex items-center text-xs text-gray-600">
            <div className="flex items-center">
              <BoltIcon className="h-3 w-3 mr-1" />
              {details.chargers} chargers
            </div>
          </div>

          {station.distance && (
            <div className="mt-2 text-xs text-gray-500">
              {Math.round(station.distance)}m away
            </div>
          )}
        </>
      ) : (
        // Basic info only (when not visible yet or no details)
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium text-gray-900 text-sm">
              Station {station.stationId || station.id}
            </h3>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPinIcon className="h-3 w-3 mr-1" />
              {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
            </div>
            {!isVisible && (
              <div className="text-xs text-gray-400 mt-1">
                Scroll to load details...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}