// liveview.js
let map;
let markers = [];
let deliveryData = { routes: [], callins: [], drivers: [] };
let autoRefreshTimer = null;

window.addEventListener('DOMContentLoaded', async () => {
    initMap();
    try { await refreshLiveView(); } catch (e) { console.warn('Backend unavailable:', e.message); }
    resetAutoRefresh();
});

function initMap() {
    map = L.map('map').setView([55.1707, -118.7946], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
    }).addTo(map);
    L.circleMarker([55.1707, -118.7946], {
        radius: 10, fillColor: '#1976d2', color: '#0d47a1', weight: 2, fillOpacity: 0.9
    }).addTo(map).bindPopup('<strong>Culligan Depot</strong><br>Grande Prairie, AB');
}

async function refreshLiveView() {
    await Promise.all([loadRouteData(), loadCallInData(), loadDriverData()]);
    updateStats(); updateMap(); updateDriverPanel();
}

async function loadRouteData() {
    try { const r = await apiCall('getRoutes', {}); if (r.success) deliveryData.routes = r.routes || []; } catch(e) {}
}
async function loadCallInData() {
    try { const r = await apiCall('getCallIns', {}); if (r.success) deliveryData.callins = (r.callins || []).filter(c => c.status !== 'completed' && c.status !== 'cancelled'); } catch(e) {}
}
async function loadDriverData() {
    try { const r = await apiCall('getUsers', {}); if (r.success) { deliveryData.drivers = (r.users || []).filter(u => u.role === 'driver'); populateDriverFilter(); } } catch(e) {}
}

function populateDriverFilter() {
    var sel = document.getElementById('driverFilter');
    var cur = sel.value;
    sel.innerHTML = '<option value="all">All Drivers</option>';
    deliveryData.drivers.forEach(function(d) {
        var n = (d.firstName||'') + ' ' + (d.lastName||'');
        sel.innerHTML += '<option value="' + n.trim() + '">' + n.trim() + '</option>';
    });
    sel.value = cur || 'all';
}

function updateStats() {
    var ad = deliveryData.drivers.filter(function(d){return d.status==='active'}).length;
    var ts=0, ds=0;
    deliveryData.routes.forEach(function(r){ var s=r.stops||[]; ts+=s.length; ds+=s.filter(function(x){return x.delivered}).length; });
    document.getElementById('statDrivers').textContent = ad;
    document.getElementById('statDelivered').textContent = ds;
    document.getElementById('statRemaining').textContent = ts - ds;
    document.getElementById('statCallIns').textContent = deliveryData.callins.length;
}

function updateMap() {
    markers.forEach(function(m){map.removeLayer(m)}); markers = [];
    var fd = document.getElementById('driverFilter').value;
    deliveryData.routes.forEach(function(route) {
        if (fd !== 'all' && route.driverName !== fd) return;
        (route.stops||[]).forEach(function(stop, idx) {
            if (!stop.lat || !stop.lng) return;
            var c = stop.delivered ? '#388e3c' : '#f57c00';
            var m = L.circleMarker([stop.lat, stop.lng], { radius:8, fillColor:c, color:'#fff', weight:2, fillOpacity:0.85 }).addTo(map);
            m.bindPopup('<strong>Stop '+(idx+1)+'</strong><br>'+(stop.customerName||'')+'<br>'+(stop.address||'')+'<br>Driver: '+(route.driverName||'Unassigned')+'<br>Status: '+(stop.delivered?'Delivered':'Pending'));
            markers.push(m);
        });
    });
    deliveryData.callins.forEach(function(ci) {
        if (!ci.lat || !ci.lng) return;
        var c = ci.priority==='urgent' ? '#d32f2f' : '#f57c00';
        var m = L.circleMarker([ci.lat, ci.lng], { radius:9, fillColor:c, color:'#fff', weight:2, fillOpacity:0.9 }).addTo(map);
        m.bindPopup('<strong>Call-In</strong><br>'+(ci.customerName||'')+'<br>'+(ci.address||'')+'<br>Product: '+(ci.product||'')+' x'+(ci.quantity||1));
        markers.push(m);
    });
    deliveryData.drivers.forEach(function(d) {
        if (!d.lat||!d.lng||d.status!=='active') return;
        var n=(d.firstName||'')+' '+(d.lastName||'');
        if (fd!=='all' && n.trim()!==fd) return;
        var m = L.circleMarker([d.lat,d.lng],{radius:10,fillColor:'#7b1fa2',color:'#fff',weight:3,fillOpacity:0.9}).addTo(map);
        m.bindPopup('<strong>'+n+'</strong><br>Driver Location'); markers.push(m);
    });
}

function updateDriverPanel() {
    var c = document.getElementById('driverList'); c.innerHTML = '';
    if (!deliveryData.drivers.length) { c.innerHTML='<p style="color:#999;">No drivers found.</p>'; return; }
    deliveryData.drivers.forEach(function(d) {
        var n=(d.firstName||'')+' '+(d.lastName||'');
        var sc=d.status==='active'?'ds-active':'ds-offline', st=d.status==='active'?'Active':'Offline';
        var ds=0,dd=0;
        deliveryData.routes.forEach(function(r){ if(r.driverName===n.trim()){var s=r.stops||[];ds+=s.length;dd+=s.filter(function(x){return x.delivered}).length;}});
        var row=document.createElement('div'); row.className='driver-row';
        row.innerHTML='<div><span class="driver-name">'+n+'</span><span style="color:#666;font-size:0.85em;margin-left:10px;">'+dd+'/'+ds+' stops</span></div><span class="driver-status '+sc+'">'+st+'</span>';
        c.appendChild(row);
    });
}

function resetAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    var cb = document.getElementById('autoRefresh');
    var iv = parseInt(document.getElementById('refreshInterval').value)*1000;
    if (cb.checked) autoRefreshTimer = setInterval(function(){ try{refreshLiveView();}catch(e){} }, iv);
    cb.onchange = function() {
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
        if (cb.checked) autoRefreshTimer = setInterval(function(){ try{refreshLiveView();}catch(e){} }, iv);
    };
}
