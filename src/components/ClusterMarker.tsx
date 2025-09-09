import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { useMemo } from 'react';
import { ClusterPoint } from '../hooks/useCluster';

interface ClusterMarkerProps {
  cluster: ClusterPoint;
  onClick: (cluster: ClusterPoint) => void;
}

export default function ClusterMarker({ cluster, onClick }: ClusterMarkerProps) {
  const pointCount = cluster.properties.point_count || 0;
  
  // Calculate cluster size
  const clusterSize = useMemo(() => {
    // Base size 64px, scale up based on point count
    let size = 64;
    
    if (pointCount >= 100) {
      size = 96;
    } else if (pointCount >= 20) {
      size = 80;
    }
    
    return size;
  }, [pointCount]);
  
  // Create cluster icon with cluster.png background
  const icon = useMemo(() => {
    return L.divIcon({
      className: 'cluster-div-icon',
      html: `
        <div class="cluster-marker" style="width: ${clusterSize}px; height: ${clusterSize}px; background-image: url('/cluster.png'); background-size: contain; background-repeat: no-repeat; background-position: center;">
          <div class="cluster-inner">
            <span>${pointCount}</span>
          </div>
        </div>
      `,
      iconSize: [clusterSize, clusterSize],
      iconAnchor: [clusterSize / 2, clusterSize / 2],
    });
  }, [pointCount, clusterSize]);
    
  return (
    <Marker
      position={[cluster.geometry.coordinates[1], cluster.geometry.coordinates[0]]} // [lat, lng]
      icon={icon}
      eventHandlers={{
        click: () => onClick(cluster)
      }}
    />
  );
}

// Add CSS for cluster markers
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .cluster-div-icon {
      background: transparent;
      border: none;
    }
    
    .cluster-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
      cursor: pointer;
    }
    
    .cluster-marker:hover {
      transform: scale(1.1);
    }
    
    .cluster-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    
    .cluster-inner span {
      color: white;
      font-weight: bold;
      line-height: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      font-size: 16px;
    }
  `;
  
  if (!document.head.querySelector('#cluster-styles')) {
    style.id = 'cluster-styles';
    document.head.appendChild(style);
  }
}