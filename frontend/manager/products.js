// products.js

let products = {
  water: [],
  coffee: []
};

let currentTab = 'water';
let editingIndex = -1;

/* -----------------------------
   INITIAL LOAD
------------------------------ */
window.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  switchTab('water');
});

/* -----------------------------
   LOAD PRODUCTS FROM BACKEND
------------------------------ */
async function loadProducts() {
  const res = await apiCall('getProducts', {});
  if (!res.success) {
    showAlert('Failed to load products: ' + res.error);
    return;
  }

  products.water = res.water || [];
  products.coffee = res.coffee || [];

  renderTable();
}

/* -----------------------------
   SWITCH BETWEEN WATER / COFFEE
------------------------------ */
function switchTab(tab) {
  currentTab = tab;

  document.getElementById('tabWater').classList.remove('active');
  document.getElementById('tabCoffee').classList.remove('active');

  if (tab === 'water') {
    document.getElementById('tabWater').classList.add('active');
  } else {
    document.getElementById('tabCoffee').classList.add('active');
  }

  renderTable();
}

/* -----------------------------
   RENDER PRODUCT TABLE
------------------------------ */
function renderTable() {
  const tableHead = document.getElementById('headerRow');
  const tbody = document.querySelector('#productTable tbody');

  tbody.innerHTML = '';

  const list = products[currentTab];
  if (!list || list.length === 0) {
    tableHead.innerHTML = '<th>No products found</th>';
    return;
  }

  const headers = Object.keys(list[0]);

  tableHead.innerHTML = '';
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    tableHead.appendChild(th);
  });

  const editTh = document.createElement('th');
  editTh.textContent = 'Edit';
  tableHead.appendChild(editTh);

  list.forEach((p, idx) => {
    const tr = document.createElement('tr');

    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = p[h] || '';
      tr.appendChild(td);
    });

    const editTd = document.createElement('td');
    editTd.innerHTML = `<button onclick="editProduct(${idx})">Edit</button>`;
    tr.appendChild(editTd);

    tbody.appendChild(tr);
  });
}

/* -----------------------------
   ADD NEW PRODUCT
------------------------------ */
function addProduct() {
  editingIndex = -1;
  document.getElementById('editTitle').textContent = 'Add New Product';

  const list = products[currentTab];
  const headers = list.length ? Object.keys(list[0]) : ['Name', 'Price', 'Code'];

  const container = document.getElementById('editFields');
  container.innerHTML = '';

  headers.forEach(h => {
    container.innerHTML += `
      <label>${h}:</label>
      <input id="field_${h}" value="">
    `;
  });

  document.getElementById('editBox').style.display = 'block';
}

/* -----------------------------
   EDIT EXISTING PRODUCT
------------------------------ */
function editProduct(index) {
  editingIndex = index;
  const list = products[currentTab];
  const p = list[index];

  document.getElementById('editTitle').textContent = 'Edit Product';

  const headers = Object.keys(p);
  const container = document.getElementById('editFields');
  container.innerHTML = '';

  headers.forEach(h => {
    container.innerHTML += `
      <label>${h}:</label>
      <input id="field_${h}" value="${p[h] || ''}">
    `;
  });

  document.getElementById('editBox').style.display = 'block';
}

/* -----------------------------
   SAVE PRODUCT (NEW OR EDIT)
------------------------------ */
async function saveProduct() {
  const list = products[currentTab];

  const headers = list.length
    ? Object.keys(list[0])
    : Array.from(document.querySelectorAll('#editFields input')).map(i =>
        i.id.replace('field_', '')
      );

  const obj = {};
  headers.forEach(h => {
    obj[h] = document.getElementById('field_' + h).value;
  });

  if (editingIndex === -1) {
    list.push(obj);
  } else {
    list[editingIndex] = obj;
  }

  const res = await apiCall('saveProducts', {
    water: products.water,
    coffee: products.coffee
  });

  if (res.success) {
    showAlert('Product saved.');
    document.getElementById('editBox').style.display = 'none';
    renderTable();
  } else {
    showAlert('Failed to save product: ' + res.error);
  }
}
