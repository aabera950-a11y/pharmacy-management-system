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
    const adminDashboard = document.getElementById('adminDashboard');

    if (role === 'SELLER') {
        if(storeSection) storeSection.style.display = 'none';
        if(adminSection) adminSection.style.display = 'none';
        if(adminDashboard) adminDashboard.style.display = 'none';
    }
    else if (role === 'STORE_KEEPER') {
        if(adminSection) adminSection.style.display = 'none';
        if(storeSection) storeSection.style.display = 'block';
        if(adminDashboard) adminDashboard.style.display = 'none';
    }
    else if (role === 'ADMIN') {
        if(adminSection) adminSection.style.display = 'block';
        if(storeSection) storeSection.style.display = 'block';
        if(adminDashboard) adminDashboard.style.display = 'block'; // Show Dashboard to Admin
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
        .then(sales => {
            displaySales(sales);
            calculateDashboard(sales); // NEW: Calculate financials
        });
}
// --- 3. DASHBOARD LOGIC (FINANCIAL MATH) ---

function calculateDashboard(sales) {
    let totalRev = 0;
    let totalProf = 0;
    let totalItems = 0;

    const today = new Date().toDateString();

    sales.forEach(s => {
        totalRev += s.totalPrice;
        totalProf += (s.totalProfit || 0); // Handle old records without profit

        // Count items sold specifically today
        if (new Date(s.saleDate).toDateString() === today) {
            totalItems += s.quantity;
        }
    });

    document.getElementById('totalRevenue').innerText = `$${totalRev.toFixed(2)}`;
    document.getElementById('totalProfit').innerText = `$${totalProf.toFixed(2)}`;
    document.getElementById('itemsSold').innerText = totalItems;
}



// --- 4. DISPLAY LOGIC ---

function displayMedicines(data) {
    const tableBody = document.getElementById('medicineTable');
    tableBody.innerHTML = data.map(med => {
        const isLowStock = med.stockQuantity < 10;
        const expiryDateObj = new Date(med.expiryDate);
        const today = new Date();
        const isExpired = med.expiryDate && expiryDateObj < today;

        const stockStyle = isLowStock ? 'background: #ffcccc; color: #cc0000;' : 'background: #e1f5fe; color: #01579b;';
        const expiryStyle = isExpired ? 'background: #f8d7da; color: #721c24; font-weight: bold; padding: 2px 5px; border-radius: 4px;' : 'color: #7f8c8d;';

        const sellBtn = (currentUserRole === 'ADMIN' || currentUserRole === 'SELLER') ?
            `<button class="btn-sell" onclick="sellMed(${med.id}, ${med.stockQuantity}, '${med.name}')">Sell</button>` : '';

        const editBtn = (currentUserRole === 'ADMIN' || currentUserRole === 'STORE_KEEPER') ?
            `<button class="btn-edit" onclick="prepareEdit(${JSON.stringify(med).replace(/"/g, '&quot;')})">Restock</button>` : '';

        const deleteBtn = (currentUserRole === 'ADMIN') ?
            `<button class="btn-delete" onclick="deleteMed(${med.id})">Remove</button>` : '';

        return `
            <tr>
                <td><strong>#${med.id}</strong></td>
                <td><strong>${med.name}</strong><br><small>Dist: ${med.distributorName || 'N/A'}</small></td>
                <td>${med.category}</td>
                <td style="font-weight: bold;">$${med.price.toFixed(2)}</td>
                <td><span class="stock-badge" style="${stockStyle}">${med.stockQuantity} units</span></td>
                <td><span style="${expiryStyle}">${med.expiryDate || 'N/A'} ${isExpired ? '⚠️' : ''}</span></td>
                <td>${sellBtn} ${editBtn} ${deleteBtn}</td>
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

// --- 5. SALES & SEARCH ---

function searchMedicine() {
    const name = document.getElementById('searchInput').value;
    fetch(`${API_URL}/search?name=${name}`).then(res => res.json()).then(displayMedicines);
}
function sellMed(id, currentStock, name) {
    document.getElementById('modalMedName').innerText = name;
    document.getElementById('modalStockLimit').innerText = currentStock;
    document.getElementById('sellQuantity').value = 1;
    document.getElementById('salesModal').style.display = "block";

    document.getElementById('confirmSellBtn').onclick = function() {
        const qty = parseInt(document.getElementById('sellQuantity').value);
        if (qty > currentStock || qty <= 0) return alert("Invalid quantity!");

        fetch(`${API_URL}/${id}/sell?quantity=${qty}`, { method: 'POST' })
            .then(res => { if(res.ok) { loadMedicines(); closeModal(); } });
    };
}

function closeModal() { document.getElementById('salesModal').style.display = "none"; }

// --- 5. INVENTORY MANAGEMENT ---

function deleteMed(id) {
    if(confirm("Admin Action: Remove this medicine?")) {
        fetch(`${API_URL}/${id}`, { method: 'DELETE' }).then(() => loadMedicines());
    }
}

// --- 6. INVENTORY MANAGEMENT (KEEPER/ADMIN) ---

function resetForm() {
    editMode = false;
    editId = null;
    document.getElementById('medicineForm').reset();
    document.getElementById('formTitle').innerText = "+ Add New Stock";
    document.getElementById('submitBtn').innerText = "Add New Stock";
    document.getElementById('submitBtn').style.background = "#27ae60";
    document.getElementById('cancelBtn').style.display = "none";
}

// --- UPDATED PREPARE EDIT FUNCTION ---
function prepareEdit(med) {
    editMode = true;
    editId = med.id;
    document.getElementById('name').value = med.name;
    document.getElementById('category').value = med.category;
    document.getElementById('price').value = med.price;
    document.getElementById('costPrice').value = med.costPrice || 0; // Populate Cost Price
    document.getElementById('stock').value = med.stockQuantity;
    document.getElementById('expiryDate').value = med.expiryDate;
    document.getElementById('distributorName').value = med.distributorName;

    document.getElementById('formTitle').innerText = "⚠️ Restocking: " + med.name;
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Update Existing Stock";
    submitBtn.style.background = "#3498db";
    document.getElementById('cancelBtn').style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const medicineForm = document.getElementById('medicineForm');
medicineForm.onsubmit = function(e) {
    e.preventDefault();
    const medicineData = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        costPrice: parseFloat(document.getElementById('costPrice').value), // NEW
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
        .then(res => { if(res.ok) { loadMedicines(); resetForm(); } });
};