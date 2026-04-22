// customers.js
let customers = [];
let routes = [];
let waterProducts = [];
let coffeeProducts = [];
let editingIndex = -1;

window.addEventListener('DOMContentLoaded', async () => {
    await loadDropdowns();
    await loadCustomers();
});

/* ===== LOAD CUSTOMERS ===== */

async function loadCustomers() {
    try {
        var res = await apiCall('getCustomers', {});
        if (res.success) {
            customers = res.customers || [];
        } else {
            customers = [];
        }
    } catch (e) {
        console.warn('Customers not available:', e.message);
        customers = [];
    }
    renderCustomerTable();
}

/* ===== LOAD DROPDOWNS (Routes + Products) ===== */

async function loadDropdowns() {
    // Load routes
    try {
        var rr = await apiCall('getRoutes', {});
        if (rr.success) routes = rr.routes || [];
    } catch (e) { console.warn('Routes not available'); }

    // Load products
    try {
        var pr = await apiCall('getProducts', {});
        if (pr.success) {
            var all = pr.products || [].concat(pr.water || [], pr.coffee || []);
            waterProducts = all.filter(function(p) { return (p.type || p.Type || '') === 'Water'; });
            coffeeProducts = all.filter(function(p) { return (p.type || p.Type || '') === 'Coffee'; });
        }
    } catch (e) { console.warn('Products not available'); }

    populateRouteDropdown();
    populateProductDropdowns();
}

function populateRouteDropdown() {
    var sel = document.getElementById('cust_route');
    sel.innerHTML = '<option value="">None</option>';
    routes.forEach(function(r) {
        var name = r.name || r.Name || r.routeName || '';
        var id = r.id || r.Id || name;
        sel.innerHTML += '<option value="' + id + '">' + name + '</option>';
    });
}

function populateProductDropdowns() {
    var ws = document.getElementById('cust_water');
    var cs = document.getElementById('cust_coffee');
    ws.innerHTML = '<option value="">None</option>';
    cs.innerHTML = '<option value="">None</option>';
    waterProducts.forEach(function(p) {
        var n = p.name || p.Name || '';
        ws.innerHTML += '<option value="' + n + '">' + n + '</option>';
    });
    coffeeProducts.forEach(function(p) {
        var n = p.name || p.Name || '';
        cs.innerHTML += '<option value="' + n + '">' + n + '</option>';
    });
}

/* ===== RENDER TABLE ===== */

function renderCustomerTable() {
    var tbody = document.querySelector('#custTable tbody');
    tbody.innerHTML = '';
    var search = document.getElementById('filterSearch').value.toLowerCase();
    var statusFilter = document.getElementById('filterStatus').value;

    var filtered = customers;

    if (statusFilter !== 'all') {
        filtered = filtered.filter(function(c) { return String(c.active) === statusFilter; });
    }
    if (search) {
        filtered = filtered.filter(function(c) {
            return (c.company || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.address || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.city || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.phone || '').toLowerCase().indexOf(search) >= 0;
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">No customers found.</td></tr>';
        return;
    }

    filtered.forEach(function(c) {
        var origIdx = customers.indexOf(c);
        var tr = document.createElement('tr');
        var statusClass = (String(c.active) === '0') ? 'status-inactive' : 'status-active';
        var statusText = (String(c.active) === '0') ? 'INACTIVE' : 'ACTIVE';
        var routeName = c.route || '';

        // Try to resolve route name from routes list
        if (routeName && routes.length > 0) {
            var found = routes.find(function(r) { return (r.id || r.name) === routeName; });
            if (found) routeName = found.name || found.Name || routeName;
        }

        tr.innerHTML =
            '<td><strong>' + (c.company || '') + '</strong></td>' +
            '<td>' + (c.address || '') + '</td>' +
            '<td>' + (c.city || '') + '</td>' +
            '<td>' + (c.phone || '') + '</td>' +
            '<td>' + routeName + '</td>' +
            '<td class="' + statusClass + '">' + statusText + '</td>' +
            '<td>' +
                '<button onclick="editCustomer(' + origIdx + ')">Edit</button> ' +
                '<button class="btn-danger" onclick="deleteCustomer(' + origIdx + ')">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

/* ===== NEW CUSTOMER ===== */

function newCustomer() {
    editingIndex = -1;
    document.getElementById('custTitle').textContent = 'New Customer';
    document.getElementById('cust_id').value = '';
    document.getElementById('cust_company').value = '';
    document.getElementById('cust_address').value = '';
    document.getElementById('cust_city').value = '';
    document.getElementById('cust_postal').value = '';
    document.getElementById('cust_phone').value = '';
    document.getElementById('cust_email').value = '';
    document.getElementById('cust_route').value = '';
    document.getElementById('cust_water').value = '';
    document.getElementById('cust_coffee').value = '';
    document.getElementById('cust_notes').value = '';
    document.getElementById('cust_active').value = '1';
    document.getElementById('editBox').style.display = 'block';
    document.getElementById('editBox').scrollIntoView({ behavior: 'smooth' });
}

/* ===== EDIT CUSTOMER ===== */

function editCustomer(index) {
    editingIndex = index;
    var c = customers[index];
    document.getElementById('custTitle').textContent = 'Edit Customer';
    document.getElementById('cust_id').value = c.id || '';
    document.getElementById('cust_company').value = c.company || '';
    document.getElementById('cust_address').value = c.address || '';
    document.getElementById('cust_city').value = c.city || '';
    document.getElementById('cust_postal').value = c.postal || '';
    document.getElementById('cust_phone').value = c.phone || '';
    document.getElementById('cust_email').value = c.email || '';
    document.getElementById('cust_route').value = c.route || '';
    document.getElementById('cust_water').value = c.water || '';
    document.getElementById('cust_coffee').value = c.coffee || '';
    document.getElementById('cust_notes').value = c.notes || '';
    document.getElementById('cust_active').value = String(c.active) || '1';
    document.getElementById('editBox').style.display = 'block';
    document.getElementById('editBox').scrollIntoView({ behavior: 'smooth' });
}

/* ===== CANCEL EDIT ===== */

function cancelEdit() {
    document.getElementById('editBox').style.display = 'none';
    editingIndex = -1;
}

/* ===== DELETE CUSTOMER ===== */

async function deleteCustomer(index) {
    var name = customers[index].company || 'this customer';
    if (!confirm('Delete ' + name + '?')) return;

    customers.splice(index, 1);
    try {
        var res = await apiCall('saveCustomers', { customers: customers });
        if (res.success) {
            alert('Customer deleted.');
            renderCustomerTable();
        } else {
            alert('Failed to delete: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Backend error: ' + e.message);
    }
}

/* ===== SAVE CUSTOMER ===== */

async function saveCustomer() {
    var data = {
        id: document.getElementById('cust_id').value || generateId(),
        company: document.getElementById('cust_company').value,
        address: document.getElementById('cust_address').value,
        city: document.getElementById('cust_city').value,
        postal: document.getElementById('cust_postal').value,
        phone: document.getElementById('cust_phone').value,
        email: document.getElementById('cust_email').value,
        route: document.getElementById('cust_route').value,
        water: document.getElementById('cust_water').value,
        coffee: document.getElementById('cust_coffee').value,
        notes: document.getElementById('cust_notes').value,
        active: document.getElementById('cust_active').value
    };

    if (!data.company || !data.address) {
        alert('Company and Address are required.');
        return;
    }

    if (editingIndex === -1) {
        customers.push(data);
    } else {
        customers[editingIndex] = data;
    }

    try {
        var res = await apiCall('saveCustomers', { customers: customers });
        if (res.success) {
            alert(editingIndex === -1 ? 'Customer saved.' : 'Customer updated.');
            document.getElementById('editBox').style.display = 'none';
            editingIndex = -1;
            renderCustomerTable();
        } else {
            alert('Failed to save: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Backend error: ' + e.message);
    }
}

/* ===== GENERATE UNIQUE ID ===== */

function generateId() {
    return 'cust_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}
