async function geocodeAddress(address) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address);
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon)
    };
  }
  return null;
}
