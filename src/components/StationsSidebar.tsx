import { useEffect, useRef } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useStationsStore, type BasicStation } from '../store/stationsStore';
import StationListItem from './StationListItem';

interface StationsSidebarProps {
  onStationSelect?: (station: BasicStation) => void;
}

export default function StationsSidebar({ onStationSelect }: StationsSidebarProps) {
  const { stations, loading, error, selectedStationId, setSelectedStation } = useStationsStore();
  const stationRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleStationClick = (station: BasicStation) => {
    setSelectedStation(station.id);
    onStationSelect?.(station);
  };

  // Auto-scroll to selected station when it changes
  useEffect(() => {
    if (selectedStationId && stationRefs.current[selectedStationId]) {
      const element = stationRefs.current[selectedStationId];
      element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedStationId]);

  return (
    <div className="bg-gradient-to-r from-white to-white/60 backdrop-blur-md rounded-r-[3rem] shadow-lg border border-white/20 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-secondary to-secondary/60 backdrop-blur-lg">
        <h2 className="text-xl font-semibold text-white uppercase">Charging Stations</h2>
        <p className="text-sm text-white/80 mt-1">
          {stations.length} stations {loading && '(loading...)'}
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-1">Error: {error}</p>
        )}
      </div>

      {/* Stations List - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {loading && stations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading stations...</p>
          </div>
        ) : stations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MapPinIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No stations found</p>
            <p className="text-sm mt-2">Try moving the map or zooming out to find stations in other areas.</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {stations.map((station) => (
              <div 
                key={station.id}
                ref={(el) => { stationRefs.current[station.id] = el; }}
              >
                <StationListItem
                  station={station}
                  isSelected={selectedStationId === station.id}
                  onClick={handleStationClick}
                />
              </div>
            ))}
            
            {/* Loading more indicator */}
            {loading && stations.length > 0 && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}