// driver.js

let routes = [];
let currentStops = [];
let optimizedStops = [];
let currentIndex = 0;
let currentRoute = null;
let currentDate = null;
let currentDriverName = 'Driver'; // placeholder until login system added

window.addEventListener('DOMContentLoaded', async () => {
  initMap('map');
  await loadRoutes();
  wireEvents();
});

/* -----------------------------
   LOAD ROUTES
------------------------------ */
async function loadRoutes() {
  const res = await apiCall('listRoutes', {});
  if (!res.success) {
    showAlert('Failed to load routes: ' + res.error);
    return;
  }
  routes = res.routes || [];
  const sel = document.getElementById('routeSelect');
  sel.innerHTML = '';
  routes.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    sel.appendChild(opt);
  });
}

/* -----------------------------
   WIRE BUTTON EVENTS
------------------------------ */
function wireEvents() {
  document.getElementById('btnLoadRoute').addEventListener('click', onLoadRoute);
  document.getElementById('btnBack').addEventListener('click', () => moveStop(-1));
  document.getElementById('btnForward').addEventListener('click', () => moveStop(1));
  document.getElementById('btnStartRoute').addEventListener('click', onStartRoute);
  document.getElementById('btnFinishRoute').addEventListener('click', onFinishRoute);
  document.getElementById('btnDirections').addEventListener('click', openDirections);
  document.getElementById('btnGetCoords').addEventListener('click', showCurrentCoords);
}

/* -----------------------------
   LOAD ROUTE + GEOCODE
------------------------------ */
async function onLoadRoute() {
  const routeId = document.getElementById('routeSelect').value;
  const date = document.getElementById('routeDate').value;

  if (!routeId || !date) {
    showAlert('Select route and date.');
    return;
  }

  currentRoute = routes.find(r => r.id === routeId);
  currentDate = date;

  const res = await apiCall('getRouteStops', { routeId });
  if (!res.success) {
    showAlert('Failed to load stops: ' + res.error);
    return;
  }

  currentStops = res.stops || [];

  // Geocode missing coordinates
  for (let s of currentStops) {
    if (!s.latitude || !s.longitude) {
      let coords = null;

      if (isLegalLandDescription(s.location)) {
        coords = await geocodeLegalLand(s.location);
      } else {
        coords = await geocodeAddress(s.address);
      }

      if (coords) {
        s.latitude = coords.lat;
        s.longitude = coords.lon;
      }
    }
  }

  // Optimize route
  const start = currentStops[0] || { latitude: 55.17, longitude: -118.80 };
  optimizedStops = optimizeRoute(
    currentStops,
    parseFloat(start.latitude),
    parseFloat(start.longitude)
  );

  currentIndex = 0;

  renderStopList();
  showCurrentStop();
}

/* -----------------------------
   RENDER STOP LIST
------------------------------ */
function renderStopList() {
  const list = document.getElementById('stopList');
  list.innerHTML = '';

  optimizedStops.forEach((s, idx) => {
    const div = document.createElement('div');
    div.className = 'stop-item' + (idx === currentIndex ? ' active' : '');
    div.textContent = (idx + 1) + '. ' + (s.company || 'Stop');
    div.addEventListener('click', () => {
      currentIndex = idx;
      showCurrentStop();
    });
    list.appendChild(div);
  });

  addStopMarkers(optimizedStops);
}

/* -----------------------------
   SHOW CURRENT STOP DETAILS
------------------------------ */
function showCurrentStop() {
  const stop = optimizedStops[currentIndex];
  if (!stop) return;

  renderStopList(); // refresh highlight

  const details = document.getElementById('stopDetails');
  details.innerHTML = '';

  const html = `
    <h3>Stop ${(currentIndex + 1)}</h3>
    <p><strong>${stop.company || ''}</strong></p>
    <p>${stop.address || ''}</p>
    <p>${stop.city || ''} ${stop.province || ''} ${stop.postalCode || ''}</p>
    <p>Phone: ${stop.phone || ''}</p>
    <p>Email: ${stop.email || ''}</p>
    <p>Notes: ${stop.notes || ''}</p>
    <p>Special Instructions: ${stop.specialInstructions || ''}</p>

    <label>Received By:</label>
    <input type="text" id="receivedByInput" value="${stop.receivedBy || ''}">

    <label>Driver Notes:</label>
    <textarea id="driverNotes"></textarea>

    <h4>Cart</h4>
    <div id="cartContainer">
      <p>(Cart UI coming soon)</p>
    </div>

    <div class="stop-actions">
      <button onclick="onStopStatus('Cancelled')">Cancel</button>
      <button onclick="onStopStatus('Not Delivered')">Not Delivered</button>
      <button onclick="onStopStatus('Delivered')">Delivered</button>
    </div>
  `;

  details.innerHTML = html;
}

/* -----------------------------
   MOVE BETWEEN STOPS
------------------------------ */
function moveStop(delta) {
  if (!optimizedStops.length) return;

  currentIndex += delta;

  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= optimizedStops.length) currentIndex = optimizedStops.length - 1;

  showCurrentStop();
}

/* -----------------------------
   ROUTE START / FINISH
------------------------------ */
function onStartRoute() {
  showAlert('Route started.');
}

function onFinishRoute() {
  showAlert('Route finished.');
}

/* -----------------------------
   DIRECTIONS
------------------------------ */
function openDirections() {
  const stop = optimizedStops[currentIndex];
  if (!stop) return;

  const lat = stop.latitude;
  const lng = stop.longitude;

  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}

/* -----------------------------
   SHOW COORDINATES
------------------------------ */
function showCurrentCoords() {
  const stop = optimizedStops[currentIndex];
  if (!stop) return;

  showAlert(`Lat: ${stop.latitude}, Lng: ${stop.longitude}`);
}

/* -----------------------------
   STOP STATUS (Delivered / Not Delivered / Cancelled)
------------------------------ */
async function onStopStatus(status) {
  const stop = optimizedStops[currentIndex];
  if (!stop) return;

  const receivedBy = document.getElementById('receivedByInput').value || '';
  const driverNotes = document.getElementById('driverNotes').value || '';

  stop.receivedBy = receivedBy;
  stop.driverNotes = driverNotes;

  // Signature capture coming later
  const signatureBase64 = '';

  // Save delivery log
  await apiCall('saveDelivery', {
    routeName: currentRoute ? currentRoute.name : '',
    date: currentDate,
    driver: currentDriverName,
    stop: stop,
    status: status,
    reason: status === 'Not Delivered' ? driverNotes : '',
    cart: [], // cart UI coming later
    signatureBase64: signatureBase64
  });

  // If delivered → generate slip + maybe email
  if (status === 'Delivered') {
    const slipRes = await apiCall('generateDeliverySlip', {
      routeName: currentRoute ? currentRoute.name : '',
      date: currentDate,
      stop: stop,
      cart: [],
      signatureBase64: signatureBase64
    });

    if (slipRes.success) {
      await maybeEmailSlip(stop.email, slipRes);
    }
  }

  showAlert('Stop marked as ' + status);
}

/* -----------------------------
   EMAIL SLIP (if enabled)
------------------------------ */
async function maybeEmailSlip(customerEmail, slipRes) {
  const settingsRes = await apiCall('getSettings', {});
  if (!settingsRes.success) return
