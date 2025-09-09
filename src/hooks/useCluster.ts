import { useState, useRef, useCallback, useEffect } from 'react';
import { BasicStation } from '../store/stationsStore';

export interface ClusterPoint {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    stationId?: string;
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
  };
}

interface UseClusterOptions {
  radius?: number;
  maxZoom?: number;
  minZoom?: number;
  minPoints?: number;
}

interface ClusterBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export const useCluster = (options: UseClusterOptions = {}) => {
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const isLoadedRef = useRef(false);
  
  // Initialize worker
  useEffect(() => {
    try {
      workerRef.current = new Worker('/cluster-worker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, data } = e.data;
        
        switch (type) {
          case 'LOAD_SUCCESS':
            isLoadedRef.current = true;
            setLoading(false);
            setError(null);
            break;
            
          case 'LOAD_ERROR':
            isLoadedRef.current = false;
            setLoading(false);
            setError(`Load error: ${data.error}`);
            break;
            
          case 'GET_CLUSTERS_SUCCESS':
            setClusters(data.clusters);
            setLoading(false);
            setError(null);
            break;
            
          case 'GET_CLUSTERS_ERROR':
            setLoading(false);
            setError(`Clusters error: ${data.error}`);
            break;
            
          case 'GET_CLUSTER_EXPANSION_ZOOM_SUCCESS':
            // This will be handled by the callback
            break;
            
          case 'GET_CLUSTER_EXPANSION_ZOOM_ERROR':
            setError(`Expansion zoom error: ${data.error}`);
            break;
            
          default:
            setError(`Unknown response type: ${type}`);
        }
      };
      
      workerRef.current.onerror = (error) => {
        setError(`Worker error: ${error.message}`);
        setLoading(false);
      };
    } catch (err) {
      setError(`Failed to create worker: ${err}`);
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);
  
  const loadPoints = useCallback((stations: BasicStation[]) => {
    if (!workerRef.current) {
      setError('Worker not available');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Convert stations to GeoJSON points
    const points: ClusterPoint[] = stations.map((station) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [station.longitude, station.latitude], // [lng, lat] for GeoJSON
      },
      properties: {
        id: station.id,
        stationId: station.stationId,
      },
    }));
    
    workerRef.current.postMessage({
      type: 'LOAD',
      data: { points }
    });
  }, []);
  
  const getClusters = useCallback((bounds: ClusterBounds, zoom: number) => {
    if (!workerRef.current || !isLoadedRef.current) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Convert bounds to bbox format [west, south, east, north]
    const bbox = [bounds.west, bounds.south, bounds.east, bounds.north];
    
    workerRef.current.postMessage({
      type: 'GET_CLUSTERS',
      data: { bbox, zoom: Math.floor(zoom) }
    });
  }, []);
  
  const getClusterExpansionZoom = useCallback((clusterId: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }
      
      const handleMessage = (e: MessageEvent) => {
        const { type, data } = e.data;
        if (type === 'GET_CLUSTER_EXPANSION_ZOOM_SUCCESS') {
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(data.expansionZoom);
        } else if (type === 'GET_CLUSTER_EXPANSION_ZOOM_ERROR') {
          workerRef.current?.removeEventListener('message', handleMessage);
          reject(new Error(data.error));
        }
      };
      
      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.postMessage({
        type: 'GET_CLUSTER_EXPANSION_ZOOM',
        data: { clusterId }
      });
    });
  }, []);
  
  return {
    clusters,
    loading,
    error,
    loadPoints,
    getClusters,
    getClusterExpansionZoom,
    isLoaded: isLoadedRef.current,
  };
};