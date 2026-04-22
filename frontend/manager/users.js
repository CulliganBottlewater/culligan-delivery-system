// users.js
let users = [];
let editingIndex = -1;

window.addEventListener('DOMContentLoaded', async () => {
    await loadUsers();
});

async function loadUsers() {
    const res = await apiCall('getUsers', {});
    if (!res.success) {
        showAlert('Failed to load users: ' + res.error);
        return;
    }
    users = res.users || [];
    renderUserTable();
}

function renderUserTable() {
    const tbody = document.querySelector('#userTable tbody');
    tbody.innerHTML = '';
    users.forEach((u, idx) => {
        const tr = document.createElement('tr');
        const roleBadge = u.role === 'manager'
            ? '<span class="role-badge role-manager">Manager</span>'
            : '<span class="role-badge role-driver">Driver</span>';
        const statusClass = u.status === 'active' ? 'status-active' : 'status-inactive';
        tr.innerHTML = `
            <td>${u.firstName || ''} ${u.lastName || ''}</td>
            <td>${roleBadge}</td>
            <td>${u.email || ''}</td>
            <td>${u.phone || ''}</td>
            <td class="${statusClass}">${(u.status || 'active').toUpperCase()}</td>
            <td>
                <button onclick="editUser(${idx})">Edit</button>
                <button class="btn-danger" onclick="deleteUser(${idx})">Delete</button>
            </td>
        `;
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
    editingIndex = index;
    const u = users[index];
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

function cancelEdit() {
    document.getElementById('editBox').style.display = 'none';
    editingIndex = -1;
}

async function deleteUser(index) {
    if (!showConfirm('Are you sure you want to delete this user?')) return;
    users.splice(index, 1);
    const res = await apiCall('saveUsers', { users });
    if (res.success) {
        showAlert('User deleted.');
        renderUserTable();
    } else {
        showAlert('Failed to delete user: ' + res.error);
    }
}

async function saveUser() {
    const pin = document.getElementById('pin').value;
    if (pin && !/^\d{4}$/.test(pin)) {
        showAlert('PIN must be exactly 4 digits.');
        return;
    }

    const u = {
        firstName: document.getElementById('firstName').value,
        lastName:  document.getElementById('lastName').value,
        role:      document.getElementById('role').value,
        email:     document.getElementById('email').value,
        phone:     document.getElementById('phone').value,
        pin:       pin,
        status:    document.getElementById('status').value
    };

    if (!u.firstName || !u.lastName) {
        showAlert('First name and last name are required.');
        return;
    }

    if (editingIndex === -1) {
        users.push(u);
    } else {
        users[editingIndex] = u;
    }

    const res = await apiCall('saveUsers', { users });
    if (res.success) {
        showAlert('User saved.');
        document.getElementById('editBox').style.display = 'none';
        editingIndex = -1;
        renderUserTable();
    } else {
        showAlert('Failed to save user: ' + res.error);
    }
}
