// callins.js
let callins = [];
let drivers = [];
let products = { water: [], coffee: [] };
let editingIndex = -1;

window.addEventListener('DOMContentLoaded', async () => {
    await loadDrivers();
    await loadProducts();
    await loadCallIns();
});

async function loadCallIns() {
    const res = await apiCall('getCallIns', {});
    if (!res.success) {
        showAlert('Failed to load call-ins: ' + res.error);
        return;
    }
    callins = res.callins || [];
    renderCallInTable();
}

async function loadDrivers() {
    const res = await apiCall('getUsers', {});
    if (res.success) {
        drivers = (res.users || []).filter(u => u.role === 'driver' && u.status === 'active');
        populateDriverDropdown();
    }
}

async function loadProducts() {
    const res = await apiCall('getProducts', {});
    if (res.success) {
        products.water = res.water || [];
        products.coffee = res.coffee || [];
        populateProductDropdown();
    }
}

function populateDriverDropdown() {
    const sel = document.getElementById('assignedTo');
    sel.innerHTML = '<option value="">-- Unassigned --</option>';
    drivers.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.firstName + ' ' + d.lastName;
        opt.textContent = d.firstName + ' ' + d.lastName;
        sel.appendChild(opt);
    });
}

function populateProductDropdown() {
    const sel = document.getElementById('product');
    sel.innerHTML = '<option value="">-- Select Product --</option>';
    const allProducts = [...products.water, ...products.coffee];
    allProducts.forEach(p => {
        const opt = document.createElement('option');
        const name = p.Name || p.name || Object.values(p)[0] || '';
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    });
}

function renderCallInTable() {
    const tbody = document.querySelector('#callinTable tbody');
    tbody.innerHTML = '';
    const filterStatus = document.getElementById('filterStatus').value;
    const filterSearch = document.getElementById('filterSearch').value.toLowerCase();
    let filtered = callins;
    if (filterStatus !== 'all') {
        filtered = filtered.filter(c => c.status === filterStatus);
    }
    if (filterSearch) {
        filtered = filtered.filter(c =>
            (c.customerName || '').toLowerCase().includes(filterSearch) ||
            (c.address || '').toLowerCase().includes(filterSearch)
        );
    }
    filtered.forEach((c, idx) => {
        const originalIdx = callins.indexOf(c);
        const tr = document.createElement('tr');
        const statusClass = 'status-' + (c.status || 'new');
        const priorityClass = c.priority === 'urgent' ? 'priority-urgent' : 'priority-normal';
        tr.innerHTML = `
            <td>${c.dateTime || ''}</td>
            <td>${c.customerName || ''}</td>
            <td>${c.address || ''}${c.city ? ', ' + c.city : ''}</td>
            <td>${c.product || ''}</td>
            <td>${c.quantity || ''}</td>
            <td class="${priorityClass}">${(c.priority || 'normal').toUpperCase()}</td>
            <td><span class="status-badge ${statusClass}">${(c.status || 'new').toUpperCase()}</span></td>
            <td>${c.assignedTo || 'Unassigned'}</td>
            <td>
                <button onclick="editCallIn(${originalIdx})">Edit</button>
                <button class="btn-success" onclick="markComplete(${originalIdx})">Done</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function newCallIn() {
    editingIndex = -1;
    document.getElementById('editTitle').textContent = 'New Call-In';
    document.getElementById('customerName').value = '';
    document.getElementById('address').value = '';
    document.getElementById('city').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('product').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('priority').value = 'normal';
    document.getElementById('assignedTo').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('editBox').style.display = 'block';
}

function editCallIn(index) {
    editingIndex = index;
    const c = callins[index];
    document.getElementById('editTitle').textContent = 'Edit Call-In';
    document.getElementById('customerName').value = c.customerName || '';
    document.getElementById('address').value = c.address || '';
    document.getElementById('city').value = c.city || '';
    document.getElementById('phone').value = c.phone || '';
    document.getElementById('product').value = c.product || '';
    document.getElementById('quantity').value = c.quantity || '1';
    document.getElementById('priority').value = c.priority || 'normal';
    document.getElementById('assignedTo').value = c.assignedTo || '';
    document.getElementById('notes').value = c.notes || '';
    document.getElementById('editBox').style.display = 'block';
}

function cancelEdit() {
    document.getElementById('editBox').style.display = 'none';
    editingIndex = -1;
}

async function markComplete(index) {
    if (!showConfirm('Mark this call-in as completed?')) return;
    callins[index].status = 'completed';
    await saveAllCallIns('Call-in marked as completed.');
}

async function saveCallIn() {
    const c = {
        dateTime:     new Date().toLocaleString(),
        customerName: document.getElementById('customerName').value,
        address:      document.getElementById('address').value,
        city:         document.getElementById('city').value,
        phone:        document.getElementById('phone').value,
        product:      document.getElementById('product').value,
        quantity:     document.getElementById('quantity').value,
        priority:     document.getElementById('priority').value,
        assignedTo:   document.getElementById('assignedTo').value,
        notes:        document.getElementById('notes').value,
        status:       'new'
    };
    if (!c.customerName) {
        showAlert('Customer name is required.');
        return;
    }
    if (editingIndex === -1) {
        callins.push(c);
    } else {
        c.status = callins[editingIndex].status || 'new';
        c.dateTime = callins[editingIndex].dateTime || c.dateTime;
        callins[editingIndex] = c;
    }
    await saveAllCallIns('Call-in saved.');
    document.getElementById('editBox').style.display = 'none';
    editingIndex = -1;
}

async function saveAllCallIns(successMsg) {
    const res = await apiCall('saveCallIns', { callins });
    if (res.success) {
        showAlert(successMsg);
        renderCallInTable();
    } else {
        showAlert('Failed to save call-ins: ' + res.error);
    }
}
