import { create } from 'zustand';

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
  loadingDetails: Set<string>;
  error: string | null;
  currentPosition: [number, number] | null;
  currentZoom: number;
  
  // Actions
  setStations: (stations: BasicStation[]) => void;
  setStationDetails: (id: string, details: DetailedStation) => void;
  setLoading: (loading: boolean) => void;
  setLoadingDetail: (id: string, loading: boolean) => void;
  setError: (error: string | null) => void;
  setMapPosition: (position: [number, number], zoom: number) => void;
  clearStations: () => void;
  getStationDetails: (id: string) => DetailedStation | null;
}

export const useStationsStore = create<StationsState>((set, get) => ({
  stations: [],
  stationDetails: {},
  loading: false,
  loadingDetails: new Set(),
  error: null,
  currentPosition: [-23.5505, -46.6333], // São Paulo default
  currentZoom: 13,
  
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
  
  setLoading: (loading) => set({ loading }),
  
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
  clearStations: () => set({ stations: [], stationDetails: {}, error: null }),
  
  getStationDetails: (id) => {
    const state = get();
    return state.stationDetails[id] || null;
  },
}));