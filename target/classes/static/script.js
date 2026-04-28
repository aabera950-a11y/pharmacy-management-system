const API_URL = '/api/medicines';
let editMode = false;
let editId = null;
let currentUserRole = null;

// --- 1. INITIALIZATION & ROLE LOGIC ---

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/user/me')
        .then(res => res.json())
        .then(user => {
            currentUserRole = user.role;

            const nameDisplay = document.getElementById('userNameDisplay');
            if(nameDisplay) nameDisplay.innerText = `👤 ${user.username} (${user.role})`;

            applyRolePermissions(user.role);
            loadMedicines();
        })
        .catch(err => {
            console.error("Error fetching user role:", err);
            loadMedicines();
        });
});

function applyRolePermissions(role) {
    const adminSection = document.getElementById('salesHistorySection');
    const storeSection = document.getElementById('storeSection');

    if (role === 'SELLER') {
        if(storeSection) storeSection.style.display = 'none';
        if(adminSection) adminSection.style.display = 'none';
    }
    else if (role === 'STORE_KEEPER') {
        if(adminSection) adminSection.style.display = 'none';
        if(storeSection) storeSection.style.display = 'block';
    }
    else if (role === 'ADMIN') {
        if(adminSection) adminSection.style.display = 'block';
        if(storeSection) storeSection.style.display = 'block';
    }
}

// --- 2. DATA LOADING ---

function loadMedicines() {
    fetch(API_URL)
        .then(res => res.json())
        .then(displayMedicines);

    if (currentUserRole === 'ADMIN') {
        loadSalesHistory();
    }
}

function loadSalesHistory() {
    fetch('/api/medicines/sales/history')
        .then(res => res.json())
        .then(displaySales);
}

// --- 3. DISPLAY LOGIC ---

function displayMedicines(data) {
    const tableBody = document.getElementById('medicineTable');
    tableBody.innerHTML = data.map(med => {
        const isLowStock = med.stockQuantity < 10;

        // Expiry Logic: Check if current date is past the expiry date
        const expiryDateObj = new Date(med.expiryDate);
        const today = new Date();
        const isExpired = med.expiryDate && expiryDateObj < today;

        const stockStyle = isLowStock ? 'background: #ffcccc; color: #cc0000;' : 'background: #e1f5fe; color: #01579b;';
        const expiryStyle = isExpired ? 'background: #f8d7da; color: #721c24; font-weight: bold; padding: 2px 5px; border-radius: 4px;' : 'color: #7f8c8d;';

        // --- ROLE-BASED BUTTONS ---

        // SELL: Only Admin & Seller
        const canSell = (currentUserRole === 'ADMIN' || currentUserRole === 'SELLER');
        const sellBtn = canSell ? `<button class="btn-sell" onclick="sellMed(${med.id}, ${med.stockQuantity}, '${med.name}')">Sell</button>` : '';

        // RESTOCK/EDIT: Only Admin & Keeper
        const canManage = (currentUserRole === 'ADMIN' || currentUserRole === 'STORE_KEEPER');
        const editBtn = canManage ? `<button class="btn-edit" onclick="prepareEdit(${JSON.stringify(med).replace(/"/g, '&quot;')})">Restock</button>` : '';

        // DELETE: Only Admin (To remove expired/bad stock)
        const canDelete = (currentUserRole === 'ADMIN');
        const deleteBtn = canDelete ? `<button class="btn-delete" onclick="deleteMed(${med.id})">Remove</button>` : '';

        return `
            <tr>
                <td><strong>#${med.id}</strong></td>
                <td>
                    <strong>${med.name}</strong><br>
                    <small>Dist: ${med.distributorName || 'Unknown'}</small>
                </td>
                <td>${med.category}</td>
                <td style="font-weight: bold;">$${med.price.toFixed(2)}</td>
                <td>
                    <span class="stock-badge" style="${stockStyle}">
                        ${med.stockQuantity} units ${isLowStock ? '(Low!)' : ''}
                    </span>
                </td>
                <td><span style="${expiryStyle}">${med.expiryDate || 'N/A'} ${isExpired ? '⚠️' : ''}</span></td>
                <td>
                    ${sellBtn}
                    ${editBtn}
                    ${deleteBtn}
                </td>
            </tr>
        `;
    }).join('');
}

function displaySales(sales) {
    const historyBody = document.getElementById('salesHistoryTable');
    if(!historyBody) return;
    historyBody.innerHTML = sales.map(s => {
        const date = new Date(s.saleDate).toLocaleString();
        return `<tr><td>${date}</td><td>${s.medicineName}</td><td>${s.quantity}</td><td style="color: #27ae60; font-weight: bold;">$${s.totalPrice.toFixed(2)}</td></tr>`;
    }).join('');
}

// --- 4. SALES & SEARCH ---

function searchMedicine() {
    const name = document.getElementById('searchInput').value;
    fetch(`${API_URL}/search?name=${name}`)
        .then(res => res.json())
        .then(displayMedicines);
}

function sellMed(id, currentStock, name) {
    document.getElementById('modalMedName').innerText = name;
    document.getElementById('modalStockLimit').innerText = currentStock;
    document.getElementById('sellQuantity').value = 1;
    document.getElementById('sellQuantity').max = currentStock;
    document.getElementById('salesModal').style.display = "block";

    document.getElementById('confirmSellBtn').onclick = function() {
        const qty = parseInt(document.getElementById('sellQuantity').value);
        if (qty > currentStock || qty <= 0) {
            alert("Invalid quantity!");
            return;
        }
        fetch(`${API_URL}/${id}/sell?quantity=${qty}`, { method: 'POST' })
            .then(res => {
                if(res.ok) { loadMedicines(); closeModal(); }
            });
    };
}

function closeModal() { document.getElementById('salesModal').style.display = "none"; }

// --- 5. INVENTORY MANAGEMENT ---

function deleteMed(id) {
    if(confirm("Admin Action: Are you sure you want to remove this batch?")) {
        fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(() => loadMedicines());
    }
}

function prepareEdit(med) {
    editMode = true;
    editId = med.id;
    document.getElementById('name').value = med.name;
    document.getElementById('category').value = med.category;
    document.getElementById('price').value = med.price;
    document.getElementById('stock').value = med.stockQuantity;
    document.getElementById('expiryDate').value = med.expiryDate;
    document.getElementById('distributorName').value = med.distributorName;

    const submitBtn = document.querySelector('.btn-add');
    submitBtn.innerText = "Update & Restock Stock";
    submitBtn.style.background = "#3498db";
    window.scrollTo(0, 0);
}

const medicineForm = document.getElementById('medicineForm');
medicineForm.onsubmit = function(e) {
    e.preventDefault();
    const medicineData = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stockQuantity: parseInt(document.getElementById('stock').value),
        expiryDate: document.getElementById('expiryDate').value,
        distributorName: document.getElementById('distributorName').value
    };

    const method = editMode ? 'PUT' : 'POST';
    const url = editMode ? `${API_URL}/${editId}` : API_URL;

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicineData)
    })
        .then(res => {
            if(res.ok) {
                loadMedicines();
                medicineForm.reset();
                editMode = false;
                editId = null;
                document.querySelector('.btn-add').innerText = "Add to Inventory";
                document.querySelector('.btn-add').style.background = "#27ae60";
            }
        });
};