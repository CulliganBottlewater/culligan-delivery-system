let map;
let markersLayer;
let routeLine;

function initMap(containerId, centerLat = 55.17, centerLng = -118.80, zoom = 8) {
  map = L.map(containerId).setView([centerLat, centerLng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function clearMap() {
  if (markersLayer) markersLayer.clearLayers();
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

function addStopMarkers(stops) {
  clearMap();
  const latlngs = [];
  stops.forEach((s, idx) => {
    const lat = parseFloat(s.latitude);
    const lng = parseFloat(s.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    latlngs.push([lat, lng]);
    const marker = L.marker([lat, lng]).addTo(markersLayer);
    marker.bindTooltip((idx + 1) + ' - ' + (s.company || 'Stop'));
  });
  if (latlngs.length > 1) {
    routeLine = L.polyline(latlngs, { color: 'blue' }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
  }
}
