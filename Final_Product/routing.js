// DIJKSTRA'S ALGORITHM FOR SAFEST PATH
/**
 * Dijkstra's algorithm to find the safest path between two nodes
 * Minimizes total weight (crime score + distance)
 * @param {number} startNodeId Starting node ID
 * @param {number} endNodeId Ending node ID
 * @returns {Array|null} Path as array of node IDs, or null if no path found
 */
function dijkstra(startNodeId, endNodeId) {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
  
    // Initialize all nodes
    graph.nodes.forEach(node => {
      distances[node.id] = Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });
    distances[startNodeId] = 0;
  
    // Main algorithm loop
    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode = null;
      let minDist = Infinity;
  
      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDist) {
          minDist = distances[nodeId];
          currentNode = nodeId;
        }
      });
  
      // If no reachable node found or we reached destination, stop
      if (currentNode === null || currentNode === endNodeId) break;
  
      unvisited.delete(currentNode);
  
      // Check all neighbors of current node
      graph.edges.forEach(edge => {
        let neighbor = null;
        let weight = edge.weight;
  
        // Edges are bidirectional
        if (edge.from === currentNode) {
          neighbor = edge.to;
        } else if (edge.to === currentNode) {
          neighbor = edge.from;
        }
  
        // If this is a neighbor we haven't visited yet
        if (neighbor !== null && unvisited.has(neighbor)) {
          const alt = distances[currentNode] + weight;
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = currentNode;
          }
        }
      });
    }
  
    // Reconstruct path from end to start
    const path = [];
    let current = endNodeId;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
  
    return path.length > 1 ? path : null;
  }
  
  // ============================================================
  // ROUTE FINDING & DISPLAY
  // ============================================================
  
  /**
   * Find and display the safest route between start and end points
   */
  function findSafestRoute() {
    // Validate inputs
    if (!startPoint || !endPoint) {
      alert('Please select both start and end points!');
      return;
    }
  
    if (graph.nodes.length === 0) {
      alert('Street data not loaded yet. Please wait...');
      return;
    }
  
    // Find nearest nodes to start/end points
    const startNode = findNearestNode(startPoint.lat, startPoint.lng);
    const endNode = findNearestNode(endPoint.lat, endPoint.lng);
  
    // Run Dijkstra's algorithm
    const path = dijkstra(startNode.id, endNode.id);
  
    if (!path) {
      alert('No route found!');
      return;
    }
  
    // Remove old route if exists
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }
  
    // Convert path to coordinates
    const routeCoords = path.map(nodeId => {
      const node = graph.nodes[nodeId];
      return [node.lat, node.lng];
    });
  
    // Draw route on map
    routeLayer = L.polyline(routeCoords, {
      color: '#60a5fa',
      weight: 6,
      opacity: 0.95,
      dashArray: '10, 8'
    }).addTo(map);
  
    // Calculate route statistics
    let totalCrimes = 0;
    let totalDistance = 0;
  
    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i];
      const toId = path[i + 1];
  
      // Find the edge between these nodes
      const edge = graph.edges.find(e =>
        (e.from === fromId && e.to === toId) ||
        (e.to === fromId && e.from === toId)
      );
  
      if (edge) {
        totalCrimes += edge.crimes;
      }
  
      const fromNode = graph.nodes[fromId];
      const toNode = graph.nodes[toId];
      totalDistance += getDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
    }
  
    // Update UI with route information
    const miles = totalDistance * 0.621371; // Convert km to miles
    document.getElementById('routeDistance').textContent = `${miles.toFixed(2)} mi`;
    document.getElementById('routeCrimeScore').textContent = totalCrimes;
    document.getElementById('routeSegments').textContent = path.length - 1;
  
    // Calculate safety rating
    const avgCrimes = totalCrimes / (path.length - 1);
    let safetyRating, safetyColor;
  
    if (avgCrimes <= 2) {
      safetyRating = 'Very Safe';
      safetyColor = '#22c55e';
    } else if (avgCrimes <= 5) {
      safetyRating = 'Safe';
      safetyColor = '#eab308';
    } else if (avgCrimes <= 8) {
      safetyRating = 'Moderate';
      safetyColor = '#f97316';
    } else {
      safetyRating = 'Caution Advised';
      safetyColor = '#ef4444';
    }
  
    document.getElementById('safetyRating').textContent = safetyRating;
    document.getElementById('safetyIndicator').style.backgroundColor = safetyColor;
    document.getElementById('routeInfo').style.display = 'block';
  
    // Fit map to show entire route
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
  }
  
  /**
   * Clear route and markers from map
   */
  function clearRoute() {
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    if (startMarker) {
      map.removeLayer(startMarker);
      startMarker = null;
    }
    if (endMarker) {
      map.removeLayer(endMarker);
      endMarker = null;
    }
  
    startPoint = null;
    endPoint = null;
    clickCount = 0;
  
    document.getElementById('startInput').value = '';
    document.getElementById('endInput').value = '';
    document.getElementById('routeInfo').style.display = 'none';
  }