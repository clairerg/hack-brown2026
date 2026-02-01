// ============================================================
// SAFETY FACTOR CALCULATIONS
// ============================================================
// Sources: NeighborhoodScout 2024, Yale Clery Reports, DataHaven
//
// Method:
//   1. Start with raw crime rates (per 1,000 residents)
//   2. Pick a baseline neighborhood (Downtown = 1.0)
//   3. Divide each rate by the baseline to get a pure ratio
//   4. For SAFE neighborhoods (ratio < 1.0): halve the ratio
//      to exaggerate the safety difference on the map
//   5. For UNSAFE neighborhoods (ratio >= 1.0): keep close
//      to the pure ratio, round to 1 decimal
//
// Worked out:
//   Neighborhood       Rate/1000   ÷ 38.00   Pure Ratio   Final Factor
//   ─────────────────  ─────────   ───────   ──────────   ────────────
//   Yale Campus        14.70       0.387     0.39         0.25  (halved)
//   Westville          25.00       0.658     0.66         0.30  (halved)
//   Wooster Square     28.00       0.737     0.74         0.32  (halved)
//   East Rock          33.76       0.889     0.89         0.35  (halved)
//   Downtown           38.00       1.000     1.00         1.00  (baseline)
//   The Hill           52.00       1.368     1.37         1.40  (rounded)
//   Fair Haven         55.00       1.447     1.45         1.50  (rounded)
//   Dwight             62.00       1.632     1.63         1.60  (rounded)
//   Newhallville       65.00       1.711     1.71         1.80  (rounded)
// ============================================================

const neighborhoodSafetyFactors = {
    "Yale Campus": 0.25,
    "Westville": 0.30,
    "Wooster Square": 0.32,
    "East Rock": 0.35,
    "Downtown": 1.0,
    "The Hill": 1.4,
    "Fair Haven": 1.5,
    "Dwight": 1.6,
    "Newhallville": 1.8,
    "default": 1.0
  };
  
  // ============================================================
  // NEIGHBORHOOD POLYGONS (GeoJSON)
  // ============================================================
  // Simplified neighborhood polygons for Yale walking area
  // In production, load from actual New Haven GIS
  // For now: approximate polygons covering our 2km x 2km bbox
  const neighborhoodPolygons = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "name": "Yale Campus" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9320, 41.3050], [-72.9320, 41.3110],
            [-72.9240, 41.3110], [-72.9240, 41.3050],
            [-72.9320, 41.3050]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "East Rock" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9280, 41.3110], [-72.9280, 41.3180],
            [-72.9180, 41.3180], [-72.9180, 41.3110],
            [-72.9280, 41.3110]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Westville" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9450, 41.3050], [-72.9450, 41.3130],
            [-72.9320, 41.3130], [-72.9320, 41.3050],
            [-72.9450, 41.3050]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Wooster Square" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9200, 41.3020], [-72.9200, 41.3100],
            [-72.9100, 41.3100], [-72.9100, 41.3020],
            [-72.9200, 41.3020]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "The Hill" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9400, 41.2980], [-72.9400, 41.3050],
            [-72.9280, 41.3050], [-72.9280, 41.2980],
            [-72.9400, 41.2980]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Dwight" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9500, 41.3050], [-72.9500, 41.3120],
            [-72.9450, 41.3120], [-72.9450, 41.3050],
            [-72.9500, 41.3050]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": { "name": "Downtown" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-72.9320, 41.3050], [-72.9320, 41.3110],
            [-72.9240, 41.3110], [-72.9240, 41.3050],
            [-72.9320, 41.3050]
          ]]
        }
      }
    ]
  };