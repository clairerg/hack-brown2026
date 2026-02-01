// ============================================================
// MAIN APPLICATION INITIALIZATION
// ============================================================

/**
 * Initialize the application
 * This runs when the page loads
 */
(function initializeApp() {
    console.log('SafeWalking: Initializing application...');
    console.log('Crime data sources: NeighborhoodScout 2024, Yale Clery Reports, DataHaven');
    console.log('Using Turf.js for point-in-polygon detection');
    console.log('Using Dijkstra\'s algorithm for pathfinding');
    
    // Load street data from OpenStreetMap
    loadStreetData();
  })();
  
  // ============================================================
  // DEBUGGING HELPERS
  // ============================================================
  
  /**
   * Log neighborhood information for debugging
   */
  function debugNeighborhoods() {
    console.log('=== NEIGHBORHOOD SAFETY FACTORS ===');
    Object.keys(neighborhoodSafetyFactors).forEach(name => {
      console.log(`${name}: ${neighborhoodSafetyFactors[name]}`);
    });
  }
  
  /**
   * Log graph statistics for debugging
   */
  function debugGraph() {
    console.log('=== GRAPH STATISTICS ===');
    console.log(`Nodes: ${graph.nodes.length}`);
    console.log(`Edges: ${graph.edges.length}`);
    
    if (graph.edges.length > 0) {
      const crimeScores = graph.edges.map(e => e.crimes);
      const minCrime = Math.min(...crimeScores);
      const maxCrime = Math.max(...crimeScores);
      const avgCrime = crimeScores.reduce((a, b) => a + b, 0) / crimeScores.length;
      
      console.log(`Crime scores - Min: ${minCrime}, Max: ${maxCrime}, Avg: ${avgCrime.toFixed(2)}`);
    }
  }
  
  // Make debug functions available globally
  window.debugNeighborhoods = debugNeighborhoods;
  window.debugGraph = debugGraph;