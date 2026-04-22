// users.js
let users = [];
let editingIndex = -1;

window.addEventListener('DOMContentLoaded', async () => {
    try { await loadUsers(); } catch (e) { console.warn('Backend unavailable:', e.message); }
});

async function loadUsers() {
    const res = await apiCall('getUsers', {});
    if (!res.success) { alert('Failed to load users'); return; }
    users = res.users || [];
    renderUserTable();
}

function renderUserTable() {
    var tbody = document.querySelector('#userTable tbody'); tbody.innerHTML = '';
    users.forEach(function(u, idx) {
        var tr = document.createElement('tr');
        var rb = u.role==='manager' ? '<span class="role-badge role-manager">Manager</span>' : '<span class="role-badge role-driver">Driver</span>';
        var sc = u.status==='active' ? 'status-active' : 'status-inactive';
        tr.innerHTML = '<td>'+(u.firstName||'')+' '+(u.lastName||'')+'</td><td>'+rb+'</td><td>'+(u.email||'')+'</td><td>'+(u.phone||'')+'</td><td class="'+sc+'">'+(u.status||'active').toUpperCase()+'</td><td><button onclick="editUser('+idx+')">Edit</button> <button class="btn-danger" onclick="deleteUser('+idx+')">Delete</button></td>';
        tbody.appendChild(tr);
    });
}

function newUser() {
    editingIndex = -1;
    document.getElementById('editTitle').textContent = 'Add New User';
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('role').value = 'driver';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('pin').value = '';
    document.getElementById('status').value = 'active';
    document.getElementById('editBox').style.display = 'block';
}

function editUser(index) {
    editingIndex = index; var u = users[index];
    document.getElementById('editTitle').textContent = 'Edit User';
    document.getElementById('firstName').value = u.firstName || '';
    document.getElementById('lastName').value = u.lastName || '';
    document.getElementById('role').value = u.role || 'driver';
    document.getElementById('email').value = u.email || '';
    document.getElementById('phone').value = u.phone || '';
    document.getElementById('pin').value = u.pin || '';
    document.getElementById('status').value = u.status || 'active';
    document.getElementById('editBox').style.display = 'block';
}

function cancelEdit() { document.getElementById('editBox').style.display = 'none'; editingIndex = -1; }

async function deleteUser(index) {
    if (!confirm('Delete this user?')) return;
    users.splice(index, 1);
    try { var r = await apiCall('saveUsers', { users: users }); if(r.success){alert('Deleted.');renderUserTable();}else{alert('Error');} } catch(e){alert('Backend error');}
}

async function saveUser() {
    var pin = document.getElementById('pin').value;
    if (pin && !/^\d{4}$/.test(pin)) { alert('PIN must be 4 digits.'); return; }
    var u = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        role: document.getElementById('role').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        pin: pin,
        status: document.getElementById('status').value
    };
    if (!u.firstName||!u.lastName) { alert('Name required.'); return; }
    if (editingIndex===-1) users.push(u); else users[editingIndex]=u;
    try { var r = await apiCall('saveUsers', { users: users }); if(r.success){alert('Saved.');document.getElementById('editBox').style.display='none';editingIndex=-1;renderUserTable();}else{alert('Error');} } catch(e){alert('Backend error');}
}
