const API_URL = '/api/medicines';
const SUPPLIER_API_URL = '/api/suppliers';
let editMode = false;
let editId = null;
let currentUserRole = null;
let currentPriceTargetId = null; // Track which medicine is being priced

// --- 1. INITIALIZATION & TAB LOGIC ---

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/user/me')
        .then(res => res.json())
        .then(user => {
            currentUserRole = user.role;
            const nameDisplay = document.getElementById('userNameDisplay');

            // Clean up the display string visually so operators don't see raw database underlines
            const userFriendlyRole = user.role ? user.role.replace('ROLE_', '') : 'UNKNOWN';
            if(nameDisplay) nameDisplay.innerText = `👤 ${user.username} (${userFriendlyRole})`;

            applyRolePermissions(user.role);
            loadMedicines();
            loadSuppliers(); // Run Supplier fetching alongside Inventory initialization
        })
        .catch(err => {
            console.error("Error fetching user role:", err);
            loadMedicines();
            loadSuppliers();
        });

    // Initialize the Price Modal Button click listener
    const confirmPriceBtn = document.getElementById('confirmPriceBtn');
    if(confirmPriceBtn) {
        confirmPriceBtn.onclick = handleUpdatePrice;
    }

    // Intercept Supplier Registration Forms
    const supplierForm = document.getElementById('supplierForm');
    if(supplierForm) {
        supplierForm.onsubmit = handleAddSupplier;
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMedicine();
            }
        });
    }
});

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetSection = document.getElementById(tabId + '-section');
    if(targetSection) targetSection.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[onclick="showTab('${tabId}')"]`);
    if(activeNav) activeNav.classList.add('active');

    const titles = {
        'inventory': 'Inventory Overview',
        'add-stock': 'Stock Management',
        'suppliers': 'Supplier Profiles Directory',
        'sales-history': 'Financial Sales History',
        'reports': 'Financial Intelligence Reports'
    };
    document.getElementById('tab-title').innerText = titles[tabId] || 'Dashboard';
}

function applyRolePermissions(role) {
    const navStore = document.getElementById('nav-store');
    const navSuppliers = document.getElementById('nav-suppliers');
    const navSales = document.getElementById('nav-sales');
    const navReports = document.getElementById('nav-reports');
    const costHeader = document.getElementById('costHeader');
    const priceInputGroup = document.getElementById('priceInputGroup');

    // MATCHING UPDATED: Validating prefix mapping constraints directly from H2 database records
    if (role === 'ROLE_SELLER' || role === 'SELLER') {
        if(navStore) navStore.style.display = 'none';
        if(navSuppliers) navSuppliers.style.display = 'none';
        if(navSales) navSales.style.display = 'none';
        if(navReports) navReports.style.display = 'none';
        if(costHeader) costHeader.style.display = 'none';
    } else if (role === 'ROLE_STORE_KEEPER' || role === 'STORE_KEEPER') {
        if(navSales) navSales.style.display = 'none';
        if(navReports) navReports.style.display = 'none';
        if(costHeader) costHeader.style.display = 'none';
        if(priceInputGroup) priceInputGroup.style.display = 'none';
    }
}

// --- 2. DATA LOADING ---

function loadMedicines() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            displayMedicines(data);      // Main Table
            generateDisposalReport(data); // New Report Table
        });
    if (currentUserRole === 'ROLE_ADMIN' || currentUserRole === 'ADMIN') loadSalesHistory();
}

function loadSalesHistory() {
    fetch('/api/medicines/sales/history').then(res => res.json()).then(sales => {
        displaySales(sales);
        calculateDashboard(sales);
    });
}

function loadSuppliers() {
    fetch(SUPPLIER_API_URL)
        .then(res => res.json())
        .then(suppliers => {
            populateSupplierDropdown(suppliers);
            displaySuppliersTable(suppliers);
        })
        .catch(err => {
            console.error("Supplier profiles unavailable. Operating inside standard text legacy mode:", err);
            populateSupplierDropdown([{id: 1, companyName: "Legacy/Unknown Vendor"}]);
        });
}

// --- 3. SUPPLIER UI LOGIC MANAGEMENT ---

function populateSupplierDropdown(suppliers) {
    const dropdown = document.getElementById('supplierSelect');
    if(!dropdown) return;

    dropdown.innerHTML = '<option value="" disabled selected>Select a supplier...</option>' +
        suppliers.map(sup => `<option value="${sup.id}">${sup.companyName}</option>`).join('');
}

function displaySuppliersTable(suppliers) {
    const body = document.getElementById('supplierTableBody');
    if(!body) return;

    if(suppliers.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;">No custom suppliers registered yet.</td></tr>`;
        return;
    }

    body.innerHTML = suppliers.map(sup => `
        <tr>
            <td>#${sup.id}</td>
            <td><strong>${sup.companyName}</strong></td>
            <td>${sup.contactPerson || 'N/A'}</td>
            <td>${sup.phoneNumber || 'N/A'}</td>
            <td>${sup.email || 'N/A'}</td>
            <td><small>${sup.address || 'N/A'}</small></td>
        </tr>
    `).join('');
}

function handleAddSupplier(e) {
    e.preventDefault();
    const supplierData = {
        companyName: document.getElementById('supCompanyName').value,
        contactPerson: document.getElementById('supContactPerson').value,
        phoneNumber: document.getElementById('supPhone').value,
        email: document.getElementById('supEmail').value,
        address: document.getElementById('supAddress').value
    };

    fetch(SUPPLIER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
    })
        .then(res => {
            if(res.ok) {
                document.getElementById('supplierForm').reset();
                loadSuppliers();
                showToast("Supplier profile added to database successfully.", "success");
            } else {
                showToast("Database communication failed. Check your entity mapping.", "error");
            }
        });
}

// --- 4. FINANCIAL CALCULATIONS ---

function calculateDashboard(sales) {
    let totalRev = 0, totalProf = 0, totalItems = 0;
    const today = new Date().toDateString();
    sales.forEach(s => {
        totalRev += s.totalPrice;
        totalProf += (s.totalProfit || 0);
        if (new Date(s.saleDate).toDateString() === today) totalItems += s.quantity;
    });
    document.getElementById('totalRevenue').innerText = `$${totalRev.toFixed(2)}`;
    document.getElementById('totalProfit').innerText = `$${totalProf.toFixed(2)}`;
    document.getElementById('itemsSold').innerText = totalItems;
}

// --- 5. UI DISPLAY (FIFO & ALERT SYSTEM UPDATED) ---

function displayMedicines(data) {
    const tableBody = document.getElementById('medicineTable');
    const stockAlertContainer = document.getElementById('lowStockAlertContainer');
    const expiryAlertContainer = document.getElementById('expiryAlertContainer');

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let stockItemsNeeded = [];

    let expiringSoonItems = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    tableBody.innerHTML = data.map(med => {
        const totalStock = med.batches ? med.batches.reduce((sum, b) => sum + b.quantity, 0) : 0;

        // --- STOCK LOGIC ---
        const isOutOfStock = totalStock === 0;
        const isCriticalStock = totalStock > 0 && totalStock <= 5;
        const isWarningStock = totalStock > 5 && totalStock <= 10;

        if (isOutOfStock) { outOfStockCount++; stockItemsNeeded.push(med.name); }
        else if (isCriticalStock || isWarningStock) { lowStockCount++; stockItemsNeeded.push(med.name); }

        // --- EXPIRY LOGIC ---
        let soonestExpiryDate = null;
        let isExpired = false;
        let isExpiringSoon = false;
        let latestCost = 0;

        if (med.batches && med.batches.length > 0) {
            const expiries = med.batches.map(b => new Date(b.expiryDate));
            soonestExpiryDate = new Date(Math.min(...expiries));
            latestCost = med.batches[med.batches.length - 1].costPrice;

            if (soonestExpiryDate < today) {
                isExpired = true;
            } else if (soonestExpiryDate <= thirtyDaysFromNow) {
                isExpiringSoon = true;
                expiringSoonItems.push(med.name);
            }
        }

        // Determine Row and Badge Classes
        const rowClass = isExpiringSoon ? 'row-expiring-soon' : '';
        const stockClass = (isOutOfStock || isCriticalStock) ? "critical" : (isWarningStock ? "warning" : "");
        const expiryDisplay = isExpired ? `<span class="expiry-critical">EXPIRED ⚠️</span>` :
            (isExpiringSoon ? `<span class="expiry-critical">EXPIRING SOON</span>` : (soonestExpiryDate ? soonestExpiryDate.toLocaleDateString() : "No Stock"));

        // --- BUTTON VALIDATION ---
        const canSell = !isExpired && med.price > 0 && totalStock > 0;
        const sellDisabledAttr = canSell ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"';

        // Normalized checks matching both 'ROLE_' variations for dynamic grid button generation
        const isAdmin = (currentUserRole === 'ROLE_ADMIN' || currentUserRole === 'ADMIN');
        const isSeller = (currentUserRole === 'ROLE_SELLER' || currentUserRole === 'SELLER');
        const isKeeper = (currentUserRole === 'ROLE_STORE_KEEPER' || currentUserRole === 'STORE_KEEPER');

        // Render Action Buttons based on database profile roles
        let priceBtn = isAdmin ? `<button class="${med.price <= 0 ? 'btn-price-alert' : 'btn-price'}" onclick="openPriceModal(${med.id}, '${med.name}', ${med.price}, ${latestCost})"><i class="fas fa-tag"></i> Price</button>` : '';
        const sellBtn = (isAdmin || isSeller) ? `<button class="btn-sell" ${sellDisabledAttr} onclick="sellMed(${med.id}, ${totalStock}, '${med.name}', ${isExpired}, ${med.price})"><i class="fas fa-cart-plus"></i></button>` : '';
        const editBtn = (isAdmin || isKeeper) ? `<button class="btn-edit" onclick="prepareEdit(${JSON.stringify(med).replace(/"/g, '&quot;')})"><i class="fas fa-boxes"></i></button>` : '';
        const deleteBtn = isAdmin ? `<button class="btn-delete" onclick="deleteMed(${med.id})"><i class="fas fa-trash"></i></button>` : '';

        return `<tr class="${rowClass}">
            <td>#${med.id}</td>
            <td><strong>${med.name}</strong><br><small>${med.category}</small></td>
            <td>${med.category}</td>
            <td>${med.price <= 0 ? '⚠️ Set Price' : `$${med.price.toFixed(2)}`}</td>
            <td><span class="stock-badge ${stockClass}">${totalStock}</span></td>
            <td>${expiryDisplay}</td>
            <td>${priceBtn} ${sellBtn} ${editBtn} ${deleteBtn}</td>
        </tr>`;
    }).join('');

    // --- RENDER ALERTS ---
    if (expiringSoonItems.length > 0 && expiryAlertContainer) {
        expiryAlertContainer.innerHTML = `
            <div class="expiry-banner">
                <i class="fas fa-hourglass-half"></i>
                <span><strong>Expiry Alert:</strong> ${expiringSoonItems.length} item(s) expiring within 30 days (${expiringSoonItems.join(', ')}).</span>
            </div>`;
    } else { expiryAlertContainer.innerHTML = ''; }

    if ((outOfStockCount > 0 || lowStockCount > 0) && stockAlertContainer) {
        stockAlertContainer.innerHTML = `
            <div class="alert-banner">
                <i class="fas fa-exclamation-triangle"></i>
                <span><strong>Stock Alert:</strong> ${outOfStockCount} out, ${lowStockCount} low. (${stockItemsNeeded.slice(0,3).join(', ')}...)</span>
            </div>`;
    } else { stockAlertContainer.innerHTML = ''; }
}

function displaySales(sales) {
    const historyBody = document.getElementById('salesHistoryTable');
    if(!historyBody) return;
    historyBody.innerHTML = sales.map(s => {
        const date = new Date(s.saleDate).toLocaleString();
        return `<tr><td>${date}</td><td>${s.medicineName}</td><td>${s.quantity}</td><td style="color: #27ae60; font-weight: bold;">$${s.totalPrice.toFixed(2)}</td></tr>`;
    }).join('');
}

// --- 6. ACTIONS ---

function openPriceModal(id, name, currentPrice, lastCost) {
    currentPriceTargetId = id;
    document.getElementById('priceModalMedName').innerText = name;
    document.getElementById('displayLastCost').innerText = `$${lastCost.toFixed(2)}`;
    document.getElementById('displayCurrentPrice').innerText = `$${currentPrice.toFixed(2)}`;
    document.getElementById('newSellingPrice').value = currentPrice;
    document.getElementById('priceModal').style.display = "flex";
}

function closePriceModal() {
    document.getElementById('priceModal').style.display = "none";
}

function handleUpdatePrice() {
    const price = document.getElementById('newSellingPrice').value;
    if (!price || price <= 0) {
        alert("Please enter a valid price.");
        return;
    }
    fetch(`${API_URL}/${currentPriceTargetId}/set-price?price=${price}`, {
        method: 'PATCH'
    })
        .then(res => {
            if(res.ok) {
                loadMedicines();
                closePriceModal();
            } else {
                alert("Error updating price.");
            }
        });
}

function searchMedicine() {
    const name = document.getElementById('searchInput').value;
    showTab('inventory');

    fetch(`${API_URL}/search?name=${name}`)
        .then(res => res.json())
        .then(data => {
            displayMedicines(data);
            if (name.trim() !== "") {
                if (data.length === 0) {
                    showToast(`No inventory matches found for "${name}".`, "info");
                } else {
                    showToast(`Found ${data.length} matching inventory records.`, "success");
                }
            }
        })
        .catch(err => {
            console.error("Search pipeline execution error:", err);
            showToast("Search failed. Check backend database connectivity.", "error");
        });
}

function sellMed(id, currentStock, name, isExpired, price) {
    if (isExpired) {
        showToast(`Compliance Block: ${name} is expired. Retention and sale are strictly prohibited.`, "error");
        return;
    }
    if (!price || price <= 0) {
        showToast(`Pricing Block: No selling price has been set for ${name}. Contact an administrator.`, "info");
        return;
    }
    if (currentStock <= 0) {
        showToast(`Inventory Depleted: ${name} is out of stock and cannot be sold.`, "error");
        return;
    }

    document.getElementById('modalMedName').innerText = name;
    document.getElementById('modalStockLimit').innerText = currentStock;
    document.getElementById('sellQuantity').value = 1;
    document.getElementById('salesModal').style.display = "flex";

    const confirmBtn = document.getElementById('confirmSellBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.onclick = function() {
        const qty = parseInt(document.getElementById('sellQuantity').value);
        if (isNaN(qty) || qty <= 0) {
            showToast("Invalid Input: Transaction requires a quantity of 1 or more.", "info");
            return;
        }
        if (qty > currentStock) {
            showToast("Transaction Blocked: Requested quantity exceeds available batch stock.", "error");
            return;
        }

        fetch(`${API_URL}/${id}/sell?quantity=${qty}`, { method: 'POST' })
            .then(res => {
                if(res.ok) {
                    loadMedicines();
                    closeModal();
                    if (currentUserRole === 'ROLE_ADMIN' || currentUserRole === 'ADMIN') loadSalesHistory();
                } else {
                    alert("Error processing sale. Check backend logs.");
                }
            })
            .catch(err => console.error("Sale error:", err));
    };
}

function closeModal() {
    document.getElementById('salesModal').style.display = "none";
}

function deleteMed(id) {
    const rows = Array.from(document.querySelectorAll('#medicineTable tr'));
    const targetRow = rows.find(row => row.cells[0].innerText.includes(`#${id}`));
    const medicineName = targetRow ? targetRow.cells[1].querySelector('strong').innerText : "this medicine";

    document.getElementById('deleteMedName').innerText = medicineName;
    document.getElementById('deleteModal').style.display = "flex";

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
    confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);

    newConfirmBtn.onclick = function() {
        fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if(res.ok) {
                    closeDeleteModal();
                    loadMedicines();
                } else {
                    showToast("System error: Unable to remove the selected medicine record.", "error");
                }
            })
            .catch(err => console.error("Delete error:", err));
    };
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = "none";
}

window.onclick = function(event) {
    const delModal = document.getElementById('deleteModal');
    const salesModal = document.getElementById('salesModal');
    const priceModal = document.getElementById('priceModal');

    if (event.target == delModal) closeDeleteModal();
    if (event.target == salesModal) closeModal();
    if (event.target == priceModal) closePriceModal();
}

// --- 7. FORM & BATCH INTEGRATION ---

function resetForm() {
    editMode = false;
    editId = null;
    document.getElementById('medicineForm').reset();
    document.getElementById('formTitle').innerText = "+ Add New Stock";
    document.getElementById('submitBtn').innerText = "Add Stock";
    document.getElementById('cancelBtn').style.display = "none";
}

function prepareEdit(med) {
    showTab('add-stock');
    editMode = true;
    editId = med.id;
    document.getElementById('name').value = med.name;
    document.getElementById('category').value = med.category;
    document.getElementById('stock').value = "";
    document.getElementById('costPrice').value = "";
    document.getElementById('price').value = med.price || 0;
    document.getElementById('formTitle').innerText = "Add New Batch for: " + med.name;
    document.getElementById('submitBtn').innerText = "Save Batch";
    document.getElementById('cancelBtn').style.display = "inline-block";

    if (med.batches && med.batches.length > 0 && med.batches[0].supplierId) {
        document.getElementById('supplierSelect').value = med.batches[0].supplierId;
    }
}

const medicineForm = document.getElementById('medicineForm');
if(medicineForm) {
    medicineForm.onsubmit = function(e) {
        e.preventDefault();
        const selectedSupplierId = parseInt(document.getElementById('supplierSelect').value);

        const medicineData = {
            name: document.getElementById('name').value,
            category: document.getElementById('category').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            batches: [{
                quantity: parseInt(document.getElementById('stock').value),
                costPrice: parseFloat(document.getElementById('costPrice').value),
                expiryDate: document.getElementById('expiryDate').value,
                supplierId: selectedSupplierId,
                batchNumber: "B-" + Date.now()
            }]
        };

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(medicineData)
        })
            .then(res => {
                if(res.ok) {
                    loadMedicines();
                    resetForm();
                    showTab('inventory');
                }
            });
    };
}

function generateDisposalReport(data) {
    const disposalBody = document.getElementById('disposalReportTable');
    if (!disposalBody) return;

    const today = new Date();
    let totalLoss = 0;
    let itemsToProcess = [];

    data.forEach(med => {
        if (med.batches && med.batches.length > 0) {
            med.batches.forEach(batch => {
                const expDate = new Date(batch.expiryDate);

                if (expDate < today) {
                    const lossValue = batch.quantity * batch.costPrice;
                    totalLoss += lossValue;

                    itemsToProcess.push({
                        name: med.name,
                        batchNum: batch.batchNumber || 'N/A',
                        status: '<span style="color:red; font-weight:bold;">EXPIRED</span>',
                        qty: batch.quantity,
                        loss: lossValue
                    });
                }
            });
        }
    });

    if (itemsToProcess.length === 0) {
        disposalBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">✅ No expired stock found. Everything is safe to sell.</td></tr>`;
        return;
    }

    disposalBody.innerHTML = itemsToProcess.map(item => `
        <tr>
            <td><strong>${item.name}</strong></td>
            <td>${item.batchNum}</td>
            <td>${item.status}</td>
            <td>${item.qty} units</td>
            <td>$${item.loss.toFixed(2)}</td>
        </tr>
    `).join('') + `
        <tr style="background: #fff5f5; font-weight: bold;">
            <td colspan="4" style="text-align: right; color: #c0392b;">Total Financial Loss (Expired):</td>
            <td style="color: #c0392b;">$${totalLoss.toFixed(2)}</td>
        </tr>
    `;
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-times-circle';
    if (type === 'info') iconClass = 'fa-exclamation-circle';

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <div class="toast-content">
            <span style="font-weight: 600; display: block; font-size: 0.95rem;">${type.toUpperCase()}</span>
            <span style="font-size: 0.85rem; color: #555;">${message}</span>
        </div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}