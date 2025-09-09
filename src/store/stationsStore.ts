import { create } from 'zustand';
import { ClusterPoint } from '../hooks/useCluster';

// Basic station info from getNearStations
export interface BasicStation {
  id: string;
  stationId?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  coordinates: [number, number];
}

// Detailed station info from queries.Stations.get({id})
export interface DetailedStation extends BasicStation {
  name: string;
  address: string;
  chargers: number;
  // Add other detailed fields as needed
  status?: 'online' | 'offline' | 'maintenance';
  usage?: number;
}

interface StationsState {
  stations: BasicStation[];
  stationDetails: Record<string, DetailedStation>;
  loading: boolean;
  loadingProgress: number;
  loadingDetails: Set<string>;
  error: string | null;
  currentPosition: [number, number] | null;
  currentZoom: number;
  selectedStationId: string | null;
  
  // Clustering state
  clusters: ClusterPoint[];
  visibleStations: BasicStation[]; // Only individual stations (not clustered)
  clusterLoading: boolean;
  
  // Actions
  setStations: (stations: BasicStation[]) => void;
  setStationDetails: (id: string, details: DetailedStation) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingDetail: (id: string, loading: boolean) => void;
  setError: (error: string | null) => void;
  setMapPosition: (position: [number, number], zoom: number) => void;
  setSelectedStation: (stationId: string | null) => void;
  clearStations: () => void;
  getStationDetails: (id: string) => DetailedStation | null;
  
  // Clustering actions
  setClusters: (clusters: ClusterPoint[]) => void;
  setClusterLoading: (loading: boolean) => void;
}

export const useStationsStore = create<StationsState>((set, get) => ({
  stations: [],
  stationDetails: {},
  loading: false,
  loadingProgress: 0,
  loadingDetails: new Set(),
  error: null,
  currentPosition: [-23.5505, -46.6333], // São Paulo default
  currentZoom: 13,
  selectedStationId: null,
  
  // Clustering state
  clusters: [],
  visibleStations: [],
  clusterLoading: false,
  
  setStations: (stations) => {
    // Transform and validate basic station data
    const transformedStations = stations.map(station => ({
      id: station.id || station.stationId || `station-${Math.random()}`,
      stationId: station.stationId,
      latitude: station.latitude,
      longitude: station.longitude,
      distance: station.distance,
      coordinates: [station.latitude, station.longitude] as [number, number]
    })).filter(station => 
      typeof station.latitude === 'number' &&
      typeof station.longitude === 'number' &&
      !isNaN(station.latitude) &&
      !isNaN(station.longitude) &&
      station.latitude >= -90 &&
      station.latitude <= 90 &&
      station.longitude >= -180 &&
      station.longitude <= 180
    );
    
    console.log(`Got ${stations.length} stations, ${transformedStations.length} valid`);
    set({ stations: transformedStations });
  },
  
  setStationDetails: (id, details) => set(state => ({
    stationDetails: { ...state.stationDetails, [id]: details }
  })),
  
  setLoading: (loading) => set({ loading, loadingProgress: loading ? 0 : 100 }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  setLoadingDetail: (id, loading) => set(state => {
    const newLoadingDetails = new Set(state.loadingDetails);
    if (loading) {
      newLoadingDetails.add(id);
    } else {
      newLoadingDetails.delete(id);
    }
    return { loadingDetails: newLoadingDetails };
  }),
  
  setError: (error) => set({ error }),
  setMapPosition: (position, zoom) => set({ currentPosition: position, currentZoom: zoom }),
  setSelectedStation: (stationId) => set({ selectedStationId: stationId }),
  clearStations: () => set({ 
    stations: [], 
    stationDetails: {}, 
    error: null, 
    selectedStationId: null,
    clusters: [],
    visibleStations: [] 
  }),
  
  getStationDetails: (id) => {
    const state = get();
    return state.stationDetails[id] || null;
  },
  
  setClusters: (clusters) => {
    // Separate clusters from individual stations
    const individualStations: BasicStation[] = [];
    
    clusters.forEach(cluster => {
      if (!cluster.properties.cluster) {
        // Individual station - convert ClusterPoint to BasicStation
        const station: BasicStation = {
          id: cluster.properties.id,
          stationId: cluster.properties.stationId,
          latitude: cluster.geometry.coordinates[1],
          longitude: cluster.geometry.coordinates[0],
          coordinates: [cluster.geometry.coordinates[1], cluster.geometry.coordinates[0]]
        };
        individualStations.push(station);
      }
    });
    
    set({ 
      clusters, 
      visibleStations: individualStations,
      clusterLoading: false 
    });
  },
  
  setClusterLoading: (loading) => set({ clusterLoading: loading }),
}));