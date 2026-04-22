function optimizeRoute(stops, startLat, startLng) {
  if (!stops || stops.length === 0) return [];

  const remaining = stops.slice();
  const ordered = [];
  let current = { latitude: startLat, longitude: startLng };

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDist = Number.MAX_VALUE;
    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      const d = distanceKm(current.latitude, current.longitude, parseFloat(s.latitude), parseFloat(s.longitude));
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    const next = remaining.splice(bestIndex, 1)[0];
    ordered.push(next);
    current = { latitude: parseFloat(next.latitude), longitude: parseFloat(next.longitude) };
  }

  return ordered;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(v) {
  return v * Math.PI / 180;
}
