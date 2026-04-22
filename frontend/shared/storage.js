const API_URL = 'https://script.google.com/macros/s/AKfycbxBO__ky5MXAoJBafgL8TBkM7M3C5xhdjYDZ2glqAK8ctjBIXQ80yWpE77EjmzY0aaTJQ/exec';

async function apiCall(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}
