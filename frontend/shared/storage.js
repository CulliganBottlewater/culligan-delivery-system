const API_URL = 'https://script.google.com/macros/s/AKfycby549KV2ThJnaKgChoMdIBK5sI8WY8aoYtpZ4KoXsJblH6ebfcEhvlYnqqwY9QZYMxR3w/exec';

async function apiCall(action, payload = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}
