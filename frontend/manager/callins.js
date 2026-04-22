// callins.js
let callins = [];
let drivers = [];
let products = { water: [], coffee: [] };
let editingIndex = -1;

window.addEventListener('DOMContentLoaded', async () => {
    try { await loadDrivers(); } catch(e){}
    try { await loadProducts(); } catch(e){}
    try { await loadCallIns(); } catch(e){}
});

async function loadCallIns() {
    var r = await apiCall('getCallIns', {});
    if (!r.success) { alert('Failed to load call-ins'); return; }
    callins = r.callins || []; renderCallInTable();
}
async function loadDrivers() {
    var r = await apiCall('getUsers', {});
    if (r.success) { drivers = (r.users||[]).filter(function(u){return u.role==='driver'&&u.status==='active'}); populateDriverDropdown(); }
}
async function loadProducts() {
    var r = await apiCall('getProducts', {});
    if (r.success) { products.water=r.water||[]; products.coffee=r.coffee||[]; populateProductDropdown(); }
}

function populateDriverDropdown() {
    var s = document.getElementById('assignedTo'); s.innerHTML='<option value="">-- Unassigned --</option>';
    drivers.forEach(function(d){ s.innerHTML+='<option value="'+d.firstName+' '+d.lastName+'">'+d.firstName+' '+d.lastName+'</option>'; });
}
function populateProductDropdown() {
    var s = document.getElementById('product'); s.innerHTML='<option value="">-- Select --</option>';
    [].concat(products.water, products.coffee).forEach(function(p){ var n=p.Name||p.name||''; s.innerHTML+='<option value="'+n+'">'+n+'</option>'; });
}

function renderCallInTable() {
    var tbody = document.querySelector('#callinTable tbody'); tbody.innerHTML='';
    var fs=document.getElementById('filterStatus').value, fx=document.getElementById('filterSearch').value.toLowerCase();
    var f = callins;
    if(fs!=='all') f=f.filter(function(c){return c.status===fs});
    if(fx) f=f.filter(function(c){return (c.customerName||'').toLowerCase().indexOf(fx)>=0||(c.address||'').toLowerCase().indexOf(fx)>=0});
    f.forEach(function(c){
        var oi=callins.indexOf(c), tr=document.createElement('tr');
        var sc='status-'+(c.status||'new'), pc=c.priority==='urgent'?'priority-urgent':'priority-normal';
        tr.innerHTML='<td>'+(c.dateTime||'')+'</td><td>'+(c.customerName||'')+'</td><td>'+(c.address||'')+(c.city?', '+c.city:'')+'</td><td>'+(c.product||'')+'</td><td>'+(c.quantity||'')+'</td><td class="'+pc+'">'+(c.priority||'normal').toUpperCase()+'</td><td><span class="status-badge '+sc+'">'+(c.status||'new').toUpperCase()+'</span></td><td>'+(c.assignedTo||'Unassigned')+'</td><td><button onclick="editCallIn('+oi+')">Edit</button> <button class="btn-success" onclick="markComplete('+oi+')">Done</button></td>';
        tbody.appendChild(tr);
    });
}

function newCallIn() {
    editingIndex=-1; document.getElementById('editTitle').textContent='New Call-In';
    ['customerName','address','city','phone','notes'].forEach(function(f){document.getElementById(f).value='';});
    document.getElementById('product').value=''; document.getElementById('quantity').value='1';
    document.getElementById('priority').value='normal'; document.getElementById('assignedTo').value='';
    document.getElementById('editBox').style.display='block';
}
function editCallIn(i) {
    editingIndex=i; var c=callins[i]; document.getElementById('editTitle').textContent='Edit Call-In';
    document.getElementById('customerName').value=c.customerName||''; document.getElementById('address').value=c.address||'';
    document.getElementById('city').value=c.city||''; document.getElementById('phone').value=c.phone||'';
    document.getElementById('product').value=c.product||''; document.getElementById('quantity').value=c.quantity||'1';
    document.getElementById('priority').value=c.priority||'normal'; document.getElementById('assignedTo').value=c.assignedTo||'';
    document.getElementById('notes').value=c.notes||''; document.getElementById('editBox').style.display='block';
}
function cancelEdit() { document.getElementById('editBox').style.display='none'; editingIndex=-1; }

async function markComplete(i) {
    if (!confirm('Mark completed?')) return;
    callins[i].status='completed'; await saveAllCallIns('Completed.');
}
async function saveCallIn() {
    var c = { dateTime:new Date().toLocaleString(), customerName:document.getElementById('customerName').value,
        address:document.getElementById('address').value, city:document.getElementById('city').value,
        phone:document.getElementById('phone').value, product:document.getElementById('product').value,
        quantity:document.getElementById('quantity').value, priority:document.getElementById('priority').value,
        assignedTo:document.getElementById('assignedTo').value, notes:document.getElementById('notes').value, status:'new' };
    if (!c.customerName) { alert('Customer name required.'); return; }
    if (editingIndex===-1) callins.push(c); else { c.status=callins[editingIndex].status||'new'; c.dateTime=callins[editingIndex].dateTime||c.dateTime; callins[editingIndex]=c; }
    await saveAllCallIns('Saved.'); document.getElementById('editBox').style.display='none'; editingIndex=-1;
}
async function saveAllCallIns(msg) {
    try { var r=await apiCall('saveCallIns',{callins:callins}); if(r.success){alert(msg);renderCallInTable();}else{alert('Error');} } catch(e){alert('Backend error');}
}
