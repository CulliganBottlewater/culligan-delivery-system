function isLegalLandDescription(text) {
  if (!text) return false;
  return /[0-9]{1,2}-[0-9]{1,2}-[0-9]{1,2}-W[0-9]/i.test(text) ||
         /LSD/i.test(text);
}

async function geocodeLegalLand(text) {
  const hash = [...text].reduce((a, c) => a + c.charCodeAt(0), 0);
  const lat = 55 + (hash % 100) / 1000;
  const lon = -119 - (hash % 100) / 1000;
  return { lat, lon };
}
