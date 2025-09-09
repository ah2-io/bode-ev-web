import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { BasicStation } from '../store/stationsStore';

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
  station: BasicStation;
  isSelected: boolean;
  onClick: (station: BasicStation) => void;
}

export default function StationMarker({ station, isSelected, onClick }: StationMarkerProps) {
  return (
    <Marker 
      key={station.id} 
      position={station.coordinates}
      icon={isSelected ? stationSelectedIcon : stationIcon}
      eventHandlers={{
        click: () => {
          onClick(station);
        }
      }}
    />
  );
}