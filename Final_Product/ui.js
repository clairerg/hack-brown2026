// ============================================================
// UI HELPER FUNCTIONS
// ============================================================

/**
 * Update status indicators
 * @param {boolean} loading - Whether currently loading
 * @param {string} text - Status text to display
 */
function setStatus(loading, text) {
    const headerStatus = document.getElementById('headerStatus');
    const mapPillText = document.getElementById('mapPillText');
    const mapDot = document.getElementById('mapDot');
  
    headerStatus.textContent = text;
    mapPillText.textContent = text;
  
    if (loading) {
      mapDot.style.background = '#eab308';
      mapDot.style.boxShadow = '0 0 0 4px rgba(234,179,8,0.18)';
    } else {
      mapDot.style.background = '#06b6d4';
      mapDot.style.boxShadow = '0 0 0 4px rgba(6,182,212,0.18)';
    }
  }
  
  // ============================================================
  // GEOCODING (ADDRESS SEARCH)
  // ============================================================
  
  /**
   * Geocode an address to coordinates using Nominatim API
   * @param {string} address - Address to geocode
   * @returns {Object|null} Object with lat, lng, display_name or null
   */
  async function geocodeAddress(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(address)}&format=json&limit=1&` +
        `bounded=1&viewbox=-73.1,41.5,-72.7,41.1`
      );
      const data = await response.json();
  
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }
  
  // ============================================================
  // MAP CLICK HANDLER
  // ============================================================
  
  /**
   * Handle map clicks to set start/end points
   */
  map.on('click', async function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
  
    if (clickCount === 0) {
      // Set start point (green marker)
      if (startMarker) map.removeLayer(startMarker);
      startMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background:#22c55e;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,0.35);"></div>',
          iconSize: [20, 20]
        })
      }).addTo(map);
      startPoint = { lat, lng };
  
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        if (data && data.display_name) {
          document.getElementById('startInput').value = data.display_name;
          startMarker.bindPopup(data.display_name);
        }
      } catch (error) {
        document.getElementById('startInput').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
  
      clickCount = 1;
    } else {
      // Set end point (red marker)
      if (endMarker) map.removeLayer(endMarker);
      endMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,0.35);"></div>',
          iconSize: [20, 20]
        })
      }).addTo(map);
      endPoint = { lat, lng };
  
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        if (data && data.display_name) {
          document.getElementById('endInput').value = data.display_name;
          endMarker.bindPopup(data.display_name);
        }
      } catch (error) {
        document.getElementById('endInput').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
  
      clickCount = 0;
    }
  });
  
  // ============================================================
  // ADDRESS INPUT HANDLERS
  // ============================================================
  
  /**
   * Handle start address input
   */
  document.getElementById('startInput').addEventListener('change', async function (e) {
    const address = e.target.value.trim();
    if (!address) return;
  
    // Check if it's coordinates (lat, lng format)
    const coords = address.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      if (startMarker) map.removeLayer(startMarker);
      startMarker = L.marker([coords[0], coords[1]], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background:#22c55e;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,0.35);"></div>',
          iconSize: [20, 20]
        })
      }).addTo(map);
      startPoint = { lat: coords[0], lng: coords[1] };
      map.setView([coords[0], coords[1]], 14);
    } else {
      // It's an address - geocode it
      const result = await geocodeAddress(address);
      if (result) {
        if (startMarker) map.removeLayer(startMarker);
        startMarker = L.marker([result.lat, result.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#22c55e;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,0.35);"></div>',
            iconSize: [20, 20]
          })
        }).addTo(map);
        startMarker.bindPopup(result.display_name).openPopup();
        startPoint = { lat: result.lat, lng: result.lng };
        map.setView([result.lat, result.lng], 15);
      } else {
        alert('Could not find address.');
      }
    }
  });
  
  /**
   * Handle end address input
   */
  document.getElementById('endInput').addEventListener('change', async function (e) {
    const address = e.target.value.trim();
    if (!address) return;
  
    // Check if it's coordinates (lat, lng format)
    const coords = address.split(',').map(s => parseFloat(s.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      if (endMarker) map.removeLayer(endMarker);
      endMarker = L.marker([coords[0], coords[1]], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,0.35);"></div>',
          iconSize: [20, 20]
        })
      }).addTo(map);
      endPoint = { lat: coords[0], lng: coords[1] };
    } else {
      // It's an address - geocode it
      const result = await geocodeAddress(address);
      if (result) {
        if (endMarker) map.removeLayer(endMarker);
        endMarker = L.marker([result.lat, result.lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 10px 24px rgba(0,0,0,0.35);"></div>',
            iconSize: [20, 20]
          })
        }).addTo(map);
        endMarker.bindPopup(result.display_name).openPopup();
        endPoint = { lat: result.lat, lng: result.lng };
      } else {
        alert('Could not find address.');
      }
    }
  });