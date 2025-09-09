import { useEffect, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useStationsStore } from '../store/stationsStore';

const client = generateClient();

// Cache for API requests with timestamp
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Throttle map for preventing duplicate requests
const pendingRequests = new Map<string, Promise<any>>();

export const useStationDetails = (stationId: string) => {
  const { 
    stationDetails, 
    loadingDetails, 
    setStationDetails, 
    setLoadingDetail 
  } = useStationsStore();
  
  const lastFetchRef = useRef<string>('');

  const details = stationId ? stationDetails[stationId] : null;
  const isLoading = stationId ? loadingDetails.has(stationId) : false;

  useEffect(() => {
    // Only fetch if we have a valid stationId and don't have details and we're not already loading
    if (stationId && !details && !isLoading && lastFetchRef.current !== stationId) {
      lastFetchRef.current = stationId;
      fetchStationDetails();
    }
  }, [stationId, details, isLoading]);

  const fetchStationDetails = async () => {
    if (!stationId) return;
    
    // Check cache first
    const cached = requestCache.get(stationId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setStationDetails(stationId, cached.data);
      return;
    }
    
    // Check if request is already pending
    if (pendingRequests.has(stationId)) {
      try {
        const result = await pendingRequests.get(stationId);
        if (result) {
          setStationDetails(stationId, result);
        }
      } catch (error) {
        // Request failed, continue with new request
      }
      return;
    }

    try {
      setLoadingDetail(stationId, true);
      
      // Create and store the promise
      const requestPromise = client.models.Station.get({id: stationId});
      pendingRequests.set(stationId, requestPromise);
      
      // @ts-ignore - Temporary until schema is defined
      const response = await requestPromise;

  

      if (response.data) {
        const stationData = {
          ...response.data,
          coordinates: [response.data.latitude, response.data.longitude]
        };
        
        // Cache the result
        requestCache.set(stationId, {
          data: stationData,
          timestamp: Date.now()
        });
        
        setStationDetails(stationId, stationData);
      }
    } catch (error) {
      // Error fetching station details
    } finally {
      setLoadingDetail(stationId, false);
      pendingRequests.delete(stationId);
    }
  };

  return {
    details,
    isLoading,
    refetch: fetchStationDetails,
    // Helper to clear cache for this station
    clearCache: () => {
      if (stationId) {
        requestCache.delete(stationId);
      }
    }
  };
};