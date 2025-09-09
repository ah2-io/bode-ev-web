import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { ClusterPoint } from '../hooks/useCluster';

// Station icons
const stationIcon = new L.Icon({
  iconUrl: '/station.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const stationSelectedIcon = new L.Icon({
  iconUrl: '/station-selected.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface StationMarkerProps {
  station: ClusterPoint;
  isSelected: boolean;
  onClick: (station: ClusterPoint) => void;
}

export default function StationMarker({ station, isSelected, onClick }: StationMarkerProps) {
  return (
    <Marker 
      key={station.properties.id} 
      position={[station.geometry.coordinates[1], station.geometry.coordinates[0]]} // [lat, lng]
      icon={isSelected ? stationSelectedIcon : stationIcon}
      eventHandlers={{
        click: () => {
          onClick(station);
        }
      }}
    />
  );
}