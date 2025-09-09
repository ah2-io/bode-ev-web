// Supercluster Web Worker
importScripts('https://unpkg.com/supercluster@8.0.1/dist/supercluster.min.js');

let index = null;

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'LOAD':
      try {
        // Initialize supercluster with options
        index = new Supercluster({
          radius: 60,
          maxZoom: 16,
          minZoom: 0,
          minPoints: 2,
        });
        
        // Load points into the index
        index.load(data.points);
        
        self.postMessage({
          type: 'LOAD_SUCCESS',
          data: { loaded: true }
        });
      } catch (error) {
        self.postMessage({
          type: 'LOAD_ERROR',
          data: { error: error.message }
        });
      }
      break;
      
    case 'GET_CLUSTERS':
      try {
        if (!index) {
          throw new Error('Index not initialized');
        }
        
        const { bbox, zoom } = data;
        const clusters = index.getClusters(bbox, zoom);
        
        self.postMessage({
          type: 'GET_CLUSTERS_SUCCESS',
          data: { clusters }
        });
      } catch (error) {
        self.postMessage({
          type: 'GET_CLUSTERS_ERROR',
          data: { error: error.message }
        });
      }
      break;
      
    case 'GET_CHILDREN':
      try {
        if (!index) {
          throw new Error('Index not initialized');
        }
        
        const { clusterId } = data;
        const children = index.getChildren(clusterId);
        
        self.postMessage({
          type: 'GET_CHILDREN_SUCCESS',
          data: { children }
        });
      } catch (error) {
        self.postMessage({
          type: 'GET_CHILDREN_ERROR',
          data: { error: error.message }
        });
      }
      break;
      
    case 'GET_CLUSTER_EXPANSION_ZOOM':
      try {
        if (!index) {
          throw new Error('Index not initialized');
        }
        
        const { clusterId } = data;
        const expansionZoom = index.getClusterExpansionZoom(clusterId);
        
        self.postMessage({
          type: 'GET_CLUSTER_EXPANSION_ZOOM_SUCCESS',
          data: { expansionZoom }
        });
      } catch (error) {
        self.postMessage({
          type: 'GET_CLUSTER_EXPANSION_ZOOM_ERROR',
          data: { error: error.message }
        });
      }
      break;
      
    default:
      self.postMessage({
        type: 'ERROR',
        data: { error: `Unknown message type: ${type}` }
      });
  }
};