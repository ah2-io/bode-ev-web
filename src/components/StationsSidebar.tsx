import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useStationsStore, type BasicStation } from '../store/stationsStore';
import StationListItem from './StationListItem';

interface StationsSidebarProps {
  onStationSelect?: (station: BasicStation) => void;
}

export default function StationsSidebar({ onStationSelect }: StationsSidebarProps) {
  const { stations, loading, error } = useStationsStore();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const handleStationClick = (station: BasicStation) => {
    setSelectedStationId(station.id);
    onStationSelect?.(station);
  };

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xl font-semibold text-gray-800">Charging Stations</h2>
        <p className="text-sm text-gray-600 mt-1">
          {stations.length} stations {loading && '(loading...)'}
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-1">Error: {error}</p>
        )}
      </div>

      {/* Stations List */}
      <div className="flex-1 overflow-y-auto">
        {loading && stations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
              <StationListItem
                key={station.id}
                station={station}
                isSelected={selectedStationId === station.id}
                onClick={handleStationClick}
              />
            ))}
            
            {/* Loading more indicator */}
            {loading && stations.length > 0 && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}