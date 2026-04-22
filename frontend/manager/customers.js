// customers.js

let customers = [];
let editingIndex = -1;

window.addEventListener('DOMContentLoaded', async () => {
  await loadCustomers();
});

/* -----------------------------
   LOAD CUSTOMERS FROM BACKEND
------------------------------ */
async function loadCustomers() {
  const res = await apiCall('getCustomers', {});
  if (!res.success) {
    showAlert('Failed to load customers: ' + res.error);
    return;
  }

  customers = res.customers || [];
  renderCustomerTable();
}

/* -----------------------------
   RENDER TABLE
------------------------------ */
function renderCustomerTable() {
  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';

  customers.forEach((c, idx) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${c.company || ''}</td>
      <td>${c.address || ''}</td>
      <td>${c.city || ''}</td>
      <td>${c.province || ''}</td>
      <td>${c.postalCode || ''}</td>
      <td>${c.email || ''}</td>
      <td>${c.phone || ''}</td>
      <td><button onclick="editCustomer(${idx})">Edit</button></td>
    `;

    tbody.appendChild(tr);
  });
}

/* -----------------------------
   ADD NEW CUSTOMER
------------------------------ */
function newCustomer() {
  editingIndex = -1;
  document.getElementById('editTitle').textContent = 'Add New Customer';

  document.getElementById('company').value = '';
  document.getElementById('address').value = '';
  document.getElementById('city').value = '';
  document.getElementById('province').value = '';
  document.getElementById('postalCode').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';

  document.getElementById('editBox').style.display = 'block';
}

/* -----------------------------
   EDIT EXISTING CUSTOMER
------------------------------ */
function editCustomer(index) {
  editingIndex = index;
  const c = customers[index];

  document.getElementById('editTitle').textContent = 'Edit Customer';

  document.getElementById('company').value = c.company || '';
  document.getElementById('address').value = c.address || '';
  document.getElementById('city').value = c.city || '';
  document.getElementById('province').value = c.province || '';
  document.getElementById('postalCode').value = c.postalCode || '';
  document.getElementById('email').value = c.email || '';
  document.getElementById('phone').value = c.phone || '';

  document.getElementById('editBox').style.display = 'block';
}

/* -----------------------------
   SAVE CUSTOMER (NEW OR EDIT)
------------------------------ */
async function saveCustomer() {
  const c = {
    company: document.getElementById('company').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    province: document.getElementById('province').value,
    postalCode: document.getElementById('postalCode').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value
  };

  if (editingIndex === -1) {
    customers.push(c);
  } else {
    customers[editingIndex] = c;
  }

  const res = await apiCall('saveCustomers', { customers });

  if (res.success) {
    showAlert('Customer saved.');
    document.getElementById('editBox').style.display = 'none';
    renderCustomerTable();
  } else {
    showAlert('Failed to save customer: ' + res.error);
  }
}
