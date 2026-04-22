// liveview.js
let map;
let markers = [];
let driverMarkers = [];
let deliveryData = { routes: [], callins: [], drivers: [] };
let autoRefreshTimer = null;

window.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await refreshLiveView();
    resetAutoRefresh();
});

function initMap() {
    map = L.map('map').setView([55.1707, -118.7946], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    L.circleMarker([55.1707, -118.7946], {
        radius: 10, fillColor: '#1976d2', color: '#0d47a1',
        weight: 2, fillOpacity: 0.9
    }).addTo(map).bindPopup('<strong>Culligan Depot</strong><br>Grande Prairie, AB');
}

async function refreshLiveView() {
    await Promise.all([loadRouteData(), loadCallInData(), loadDriverData()]);
    updateStats();
    updateMap();
    updateDriverPanel();
}

async function loadRouteData() {
    const res = await apiCall('getRoutes', {});
    if (res.success) deliveryData.routes = res.routes || [];
}

async function loadCallInData() {
    const res = await apiCall('getCallIns', {});
    if (res.success) {
        deliveryData.callins = (res.callins || []).filter(c => c.status !== 'completed' && c.status !== 'cancelled');
    }
}

async function loadDriverData() {
    const res = await apiCall('getUsers', {});
    if (res.success) {
        deliveryData.drivers = (res.users || []).filter(u => u.role === 'driver');
        populateDriverFilter();
    }
}

function populateDriverFilter() {
    const sel = document.getElementById('driverFilter');
    const current = sel.value;
    sel.innerHTML = '<option value="all">All Drivers</option>';
    deliveryData.drivers.forEach(d => {
        const name = (d.firstName || '') + ' ' + (d.lastName || '');
        const opt = document.createElement('option');
        opt.value = name.trim();
        opt.textContent = name.trim();
        sel.appendChild(opt);
    });
    sel.value = current || 'all';
}

function updateStats() {
    const activeDrivers = deliveryData.drivers.filter(d => d.status === 'active').length;
    let totalStops = 0;
    let deliveredStops = 0;
    deliveryData.routes.forEach(r => {
        const stops = r.stops || [];
        totalStops += stops.length;
        deliveredStops += stops.filter(s => s.delivered).length;
    });
    document.getElementById('statDrivers').textContent = activeDrivers;
    document.getElementById('statDelivered').textContent = deliveredStops;
    document.getElementById('statRemaining').textContent = totalStops - deliveredStops;
    document.getElementById('statCallIns').textContent = deliveryData.callins.length;
}

function updateMap() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    const filterDriver = document.getElementById('driverFilter').value;
    deliveryData.routes.forEach(route => {
        if (filterDriver !== 'all' && route.driverName !== filterDriver) return;
        const stops = route.stops || [];
        stops.forEach((stop, idx) => {
            if (!stop.lat || !stop.lng) return;
            const color = stop.delivered ? '#388e3c' : '#f57c00';
            const marker = L.circleMarker([stop.lat, stop.lng], {
                radius: 8, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.85
            }).addTo(map);
            marker.bindPopup(
                '<strong>Stop ' + (idx + 1) + '</strong><br>' +
                (stop.customerName || 'Unknown') + '<br>' +
                (stop.address || '') + '<br>' +
                'Driver: ' + (route.driverName || 'Unassigned') + '<br>' +
                'Status: ' + (stop.delivered ? 'Delivered' : 'Pending')
            );
            markers.push(marker);
        });
    });
    deliveryData.callins.forEach(c => {
        if (!c.lat || !c.lng) return;
        const color = c.priority === 'urgent' ? '#d32f2f' : '#f57c00';
        const marker = L.circleMarker([c.lat, c.lng], {
            radius: 9, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9
        }).addTo(map);
        marker.bindPopup(
            '<strong>Call-In</strong><br>' +
            (c.customerName || 'Unknown') + '<br>' +
            (c.address || '') + '<br>' +
            'Product: ' + (c.product || '') + ' x' + (c.quantity || 1) + '<br>' +
            'Priority: ' + (c.priority || 'normal').toUpperCase()
        );
        markers.push(marker);
    });
    deliveryData.drivers.forEach(d => {
        if (!d.lat || !d.lng) return;
        if (d.status !== 'active') return;
        const name = (d.firstName || '') + ' ' + (d.lastName || '');
        if (filterDriver !== 'all' && name.trim() !== filterDriver) return;
        const marker = L.circleMarker([d.lat, d.lng], {
            radius: 10, fillColor: '#7b1fa2', color: '#fff', weight: 3, fillOpacity: 0.9
        }).addTo(map);
        marker.bindPopup('<strong>' + name + '</strong><br>Driver Location');
        markers.push(marker);
    });
}

function updateDriverPanel() {
    const container = document.getElementById('driverList');
    container.innerHTML = '';
    if (deliveryData.drivers.length === 0) {
        container.innerHTML = '<p style="color:#999;">No drivers found.</p>';
        return;
    }
    deliveryData.drivers.forEach(d => {
        const name = (d.firstName || '') + ' ' + (d.lastName || '');
        const statusClass = d.status === 'active' ? 'ds-active' : 'ds-offline';
        const statusText = d.status === 'active' ? 'Active' : 'Offline';
        let driverStops = 0;
        let driverDelivered = 0;
        deliveryData.routes.forEach(r => {
            if (r.driverName === name.trim()) {
                const stops = r.stops || [];
                driverStops += stops.length;
                driverDelivered += stops.filter(s => s.delivered).length;
            }
        });
        const row = document.createElement('div');
        row.className = 'driver-row';
        row.innerHTML =
            '<div>' +
            '<span class="driver-name">' + name + '</span>' +
            '<span style="color:#666; font-size:0.85em; margin-left:10px;">' +
            driverDelivered + '/' + driverStops + ' stops</span>' +
            '</div>' +
            '<span class="driver-status ' + statusClass + '">' + statusText + '</span>';
        container.appendChild(row);
    });
}

function resetAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    const checkbox = document.getElementById('autoRefresh');
    const interval = parseInt(document.getElementById('refreshInterval').value) * 1000;
    if (checkbox.checked) {
        autoRefreshTimer = setInterval(() => { refreshLiveView(); }, interval);
    }
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            autoRefreshTimer = setInterval(() => { refreshLiveView(); }, interval);
        } else {
            clearInterval(autoRefreshTimer);
        }
    });
}
