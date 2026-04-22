// customers.js â€” wired to CUSTOMER_MASTER_INDEX.json via apiCall
let customers = [];
let editingIndex = -1;
let sortField = 'Company';
let sortAsc = true;

window.addEventListener('DOMContentLoaded', async () => {
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
            console.warn('getCustomers returned:', res.error || 'no data');
        }
    } catch (e) {
        console.warn('Customers not available:', e.message);
        customers = [];
    }
    renderCustomerTable();
}

/* ===== SORT ===== */
function sortTable(field) {
    if (sortField === field) {
        sortAsc = !sortAsc;
    } else {
        sortField = field;
        sortAsc = true;
    }
    renderCustomerTable();
}

/* ===== RENDER TABLE ===== */
function renderCustomerTable() {
    var tbody = document.querySelector('#custTable tbody');
    tbody.innerHTML = '';

    var search = document.getElementById('filterSearch').value.toLowerCase();
    var weekFilter = document.getElementById('filterWeek').value;
    var dayFilter = document.getElementById('filterDay').value;
    var statusFilter = document.getElementById('filterStatus').value;

    var filtered = customers;

    if (weekFilter !== 'all') {
        filtered = filtered.filter(function(c) { return String(c.Week) === weekFilter; });
    }
    if (dayFilter !== 'all') {
        filtered = filtered.filter(function(c) { return c.Day === dayFilter; });
    }
    if (statusFilter !== 'all') {
        filtered = filtered.filter(function(c) { return String(c.Active) === statusFilter; });
    }
    if (search) {
        filtered = filtered.filter(function(c) {
            return (c.Company || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.Address || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.City || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.Phone || '').toLowerCase().indexOf(search) >= 0 ||
                   (c.Email || '').toLowerCase().indexOf(search) >= 0;
        });
    }

    // Sort
    filtered.sort(function(a, b) {
        var va = (a[sortField] || '').toString().toLowerCase();
        var vb = (b[sortField] || '').toString().toLowerCase();
        if (va < vb) return sortAsc ? -1 : 1;
        if (va > vb) return sortAsc ? 1 : -1;
        return 0;
    });

    document.getElementById('countBar').textContent =
        'Showing ' + filtered.length + ' of ' + customers.length + ' customers';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">No customers found.</td></tr>';
        return;
    }

    filtered.forEach(function(c) {
        var origIdx = customers.indexOf(c);
        var tr = document.createElement('tr');
        var statusClass = (String(c.Active) === '0') ? 'status-inactive' : 'status-active';
        var statusText = (String(c.Active) === '0') ? 'INACTIVE' : 'ACTIVE';
        var schedule = '';
        if (c.Week && c.Day) {
            schedule = '<span class="schedule-badge">W' + c.Week + ' ' + c.Day.substring(0,3) + '</span>';
        }

        tr.innerHTML =
            '<td><strong>' + (c.Company || '') + '</strong></td>' +
            '<td>' + (c.Address || '') + '</td>' +
            '<td>' + (c.City || '') + '</td>' +
            '<td>' + (c.Phone || '') + '</td>' +
            '<td>' + schedule + '</td>' +
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
    document.getElementById('cust_province').value = 'AB';
    document.getElementById('cust_phone').value = '';
    document.getElementById('cust_email').value = '';
    document.getElementById('cust_week').value = '1';
    document.getElementById('cust_day').value = 'Monday';
    document.getElementById('cust_location').value = '';
    document.getElementById('cust_special').value = '';
    document.getElementById('cust_notes').value = '';
    document.getElementById('cust_receivedby').value = '';
    document.getElementById('cust_lng').value = '';
    document.getElementById('cust_lat').value = '';
    document.getElementById('cust_active').value = '1';
    document.getElementById('editBox').style.display = 'block';
    document.getElementById('editBox').scrollIntoView({ behavior: 'smooth' });
}

/* ===== EDIT CUSTOMER ===== */
function editCustomer(index) {
    editingIndex = index;
    var c = customers[index];
    document.getElementById('custTitle').textContent = 'Edit Customer';
    document.getElementById('cust_id').value = c.CustomerID || '';
    document.getElementById('cust_company').value = c.Company || '';
    document.getElementById('cust_address').value = c.Address || '';
    document.getElementById('cust_city').value = c.City || '';
    document.getElementById('cust_postal').value = c['Postal Code'] || '';
    document.getElementById('cust_province').value = c.Province || 'AB';
    document.getElementById('cust_phone').value = c.Phone || '';
    document.getElementById('cust_email').value = c.Email || '';
    document.getElementById('cust_week').value = String(c.Week || '1');
    document.getElementById('cust_day').value = c.Day || 'Monday';
    document.getElementById('cust_location').value = c.Location || '';
    document.getElementById('cust_special').value = c['Special Instructions'] || '';
    document.getElementById('cust_notes').value = c.Notes || '';
    document.getElementById('cust_receivedby').value = c['Recieved By'] || '';
    document.getElementById('cust_lng').value = c.Longitude || '';
    document.getElementById('cust_lat').value = c.Latittude || '';
    document.getElementById('cust_active').value = String(c.Active) || '1';
    document.getElementById('editBox').style.display = 'block';
    document.getElementById('editBox').scrollIntoView({ behavior: 'smooth' });
}

/* ===== CANCEL ===== */
function cancelEdit() {
    document.getElementById('editBox').style.display = 'none';
    editingIndex = -1;
}

/* ===== DELETE ===== */
async function deleteCustomer(index) {
    var name = customers[index].Company || 'this customer';
    if (!confirm('Delete "' + name + '"?')) return;
    customers.splice(index, 1);
    try {
        var res = await apiCall('saveCustomers', { customers: customers });
        if (res.success) { alert('Customer deleted.'); renderCustomerTable(); }
        else { alert('Error: ' + (res.error || 'Unknown')); }
    } catch (e) { alert('Backend error: ' + e.message); }
}

/* ===== SAVE CUSTOMER ===== */
async function saveCustomer() {
    var company = document.getElementById('cust_company').value;
    var address = document.getElementById('cust_address').value;
    if (!company || !address) {
        alert('Company and Address are required.');
        return;
    }

    var data = {
        'CustomerID':           document.getElementById('cust_id').value || generateId(),
        'Week':                 document.getElementById('cust_week').value,
        'Day':                  document.getElementById('cust_day').value,
        'Company':              company,
        'Address':              address,
        'City':                 document.getElementById('cust_city').value,
        'Postal Code':          document.getElementById('cust_postal').value,
        'Province':             document.getElementById('cust_province').value,
        'Location':             document.getElementById('cust_location').value,
        'Phone':                document.getElementById('cust_phone').value,
        'Notes':                document.getElementById('cust_notes').value,
        'Email':                document.getElementById('cust_email').value,
        'Special Instructions': document.getElementById('cust_special').value,
        'Recieved By':          document.getElementById('cust_receivedby').value,
        'Longitude':            document.getElementById('cust_lng').value,
        'Latittude':            document.getElementById('cust_lat').value,
        'Active':               document.getElementById('cust_active').value
    };

    if (editingIndex === -1) {
        customers.push(data);
    } else {
        customers[editingIndex] = data;
    }

    try {
        var res = await apiCall('saveCustomers', { customers: customers });
        if (res.success) {
            alert('Customer saved.');
            document.getElementById('editBox').style.display = 'none';
            editingIndex = -1;
            renderCustomerTable();
        } else {
            alert('Error: ' + (res.error || 'Unknown'));
        }
    } catch (e) { alert('Backend error: ' + e.message); }
}

/* ===== GENERATE ID ===== */
function generateId() {
    return 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}
