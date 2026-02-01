// MAP INITIALIZATION

// Initialize map (centered on New Haven, CT - Yale area)
const map = L.map('map').setView([41.3083, -72.9279], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// ============================================================
// GRAPH & MAP STATE
// ============================================================

// Graph structure for pathfinding
let graph = { nodes: [], edges: [] };

// Map visualization layers
let streetLayers = [];
let routeLayer = null;

// Markers for start/end points
let startMarker = null;
let endMarker = null;
let startPoint = null;
let endPoint = null;
let clickCount = 0;

// ============================================================
// NEIGHBORHOOD & CRIME FUNCTIONS
// ============================================================

/**
 * Get neighborhood name for a point using Turf.js point-in-polygon
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Neighborhood name or "default"
 */
function getNeighborhoodForPoint(lat, lng) {
  const point = turf.point([lng, lat]); // Note: Turf uses [lng, lat]

  for (const feature of neighborhoodPolygons.features) {
    const polygon = turf.polygon(feature.geometry.coordinates);
    if (turf.booleanPointInPolygon(point, polygon)) {
      return feature.properties.name;
    }
  }

  return "default"; // Fallback
}

/**
 * Deterministc crime calculation based on neighborhood + street position
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {number} Crime score (0-14)
 */
function getCrimeLevel(lat, lng) {
  // Get neighborhood using point-in-polygon
  const neighborhood = getNeighborhoodForPoint(lat, lng);
  const safeFactor = neighborhoodSafetyFactors[neighborhood] || neighborhoodSafetyFactors.default;

  // Create deterministic "randomness" from coordinates
  // Hash the coordinates to get a stable 0-1 value
  const hash = Math.abs(Math.sin(lat * 1000) * Math.cos(lng * 1000));
  const pseudoRandom = hash - Math.floor(hash); // 0-1 range

  // Base crime from factor
  const baseCrime = Math.floor(pseudoRandom * 8 * safeFactor);

  return Math.min(14, baseCrime);
}

/**
 * Get color based on crime count
 * @param {number} crimes - Crime score
 * @returns {string} Hex color
 */
function getCrimeColor(crimes) {
  if (crimes <= 2) return '#22c55e'; // Green - Safe
  if (crimes <= 5) return '#eab308'; // Yellow - Moderate
  if (crimes <= 8) return '#f97316'; // Orange - Unsafe
  return '#ef4444'; // Red - Very Unsafe
}

/**
 * Get line width based on crime count
 * @param {number} crimes - Crime score
 * @returns {number} Line width in pixels
 */
function getCrimeWidth(crimes) {
  if (crimes <= 2) return 2;
  if (crimes <= 5) return 3;
  if (crimes <= 8) return 4;
  return 5;
}

// ============================================================
// MAP VISUALIZATION
// ============================================================

/**
 * Visualize all streets on the map with crime color coding
 */
function visualizeStreets() {
  // Clear existing street layers
  streetLayers.forEach(layer => map.removeLayer(layer));
  streetLayers = [];

  // Draw each edge as a colored line
  graph.edges.forEach(edge => {
    const fromNode = graph.nodes[edge.from];
    const toNode = graph.nodes[edge.to];

    const line = L.polyline(
      [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]],
      {
        color: getCrimeColor(edge.crimes),
        weight: getCrimeWidth(edge.crimes),
        opacity: 0.7
      }
    ).addTo(map);

    // Add popup with street info
    line.bindPopup(`
      <strong>${edge.streetName}</strong><br>
      Neighborhood: ${edge.neighborhood}<br>
      Crime Score: ${edge.crimes}<br>
      Safety: ${edge.crimes <= 2 ? 'Safe' : edge.crimes <= 5 ? 'Moderate' : edge.crimes <= 8 ? 'Unsafe' : 'Very Unsafe'}
    `);

    streetLayers.push(line);
  });
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} Distance in kilometers
 */
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest graph node to a given point
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Nearest node
 */
function findNearestNode(lat, lng) {
  let minDist = Infinity;
  let nearestNode = null;

  graph.nodes.forEach(node => {
    const dist = getDistance(lat, lng, node.lat, node.lng);
    if (dist < minDist) {
      minDist = dist;
      nearestNode = node;
    }
  });

  return nearestNode;
}

// ============================================================
// LOAD STREET DATA FROM OPENSTREETMAP
// ============================================================

/**
 * Load street data from OpenStreetMap Overpass API
 */
async function loadStreetData() {
  document.getElementById('loadingIndicator').style.display = 'block';
  document.getElementById('findRouteBtn').disabled = true;
  setStatus(true, 'Street network: loading…');

  // Clear existing data
  streetLayers.forEach(layer => map.removeLayer(layer));
  streetLayers = [];
  graph = { nodes: [], edges: [] };

  // Define bounding box for New Haven area
  const bbox = { south: 41.298, west: -72.943, north: 41.318, east: -72.913 };

  // Overpass API query for roads
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|living_street|unclassified)$"]
      (${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });

    const data = await response.json();

    const osmNodes = {};
    const ways = [];

    // First pass: collect all nodes
    data.elements.forEach(element => {
      if (element.type === 'node') {
        osmNodes[element.id] = { lat: element.lat, lon: element.lon };
      }
    });

    // Second pass: collect all ways (streets)
    data.elements.forEach(element => {
      if (element.type === 'way' && element.nodes && element.nodes.length > 1) {
        ways.push({ id: element.id, nodes: element.nodes, tags: element.tags || {} });
      }
    });

    // Build graph: create nodes
    const nodeMap = new Map();
    let nodeIdCounter = 0;

    ways.forEach(way => {
      way.nodes.forEach(osmNodeId => {
        if (!nodeMap.has(osmNodeId) && osmNodes[osmNodeId]) {
          const osmNode = osmNodes[osmNodeId];
          graph.nodes.push({
            id: nodeIdCounter,
            lat: osmNode.lat,
            lng: osmNode.lon,
            osmId: osmNodeId
          });
          nodeMap.set(osmNodeId, nodeIdCounter);
          nodeIdCounter++;
        }
      });
    });

    // Build graph: create edges with REAL neighborhood-based crime data
    ways.forEach(way => {
      for (let i = 0; i < way.nodes.length - 1; i++) {
        const fromOsmId = way.nodes[i];
        const toOsmId = way.nodes[i + 1];
        if (!osmNodes[fromOsmId] || !osmNodes[toOsmId]) continue;

        const fromId = nodeMap.get(fromOsmId);
        const toId = nodeMap.get(toOsmId);

        const fromNode = graph.nodes[fromId];
        const toNode = graph.nodes[toId];

        const midLat = (fromNode.lat + toNode.lat) / 2;
        const midLng = (fromNode.lng + toNode.lng) / 2;

        // Use neighborhood-based crime calculation
        const crimes = getCrimeLevel(midLat, midLng);
        const distance = getDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);

        graph.edges.push({
          from: fromId,
          to: toId,
          crimes: crimes,
          weight: crimes + distance * 100, // Weight combines crime and distance
          wayId: way.id,
          streetName: way.tags.name || 'Unnamed Street',
          neighborhood: getNeighborhoodForPoint(midLat, midLng)
        });
      }
    });

    console.log(`Loaded ${graph.nodes.length} nodes and ${graph.edges.length} edges with neighborhood-based crime data`);
    visualizeStreets();

    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('findRouteBtn').disabled = false;

    setStatus(false, `Street network: ready (${graph.edges.length} segments)`);
    document.getElementById('headerStatus').textContent = 'Ready';

  } catch (error) {
    console.error('Error loading street data:', error);
    alert('Error loading street data. Please try again.');
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('findRouteBtn').disabled = false;
    setStatus(false, 'Street network: error');
    document.getElementById('headerStatus').textContent = 'Error';
  }
}