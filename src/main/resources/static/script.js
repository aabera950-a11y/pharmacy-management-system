const API_URL = '/api/medicines';

function loadMedicines() {
    fetch(API_URL)
        .then(res => res.json())
        .then(displayMedicines);
}

function searchMedicine() {
    const name = document.getElementById('searchInput').value;
    fetch(`${API_URL}/search?name=${name}`)
        .then(res => res.json())
        .then(displayMedicines);
}

function displayMedicines(data) {
    const tableBody = document.getElementById('medicineTable');
    tableBody.innerHTML = data.map(med => `
        <tr>
            <td><strong>#${med.id}</strong></td>
            <td>${med.name}</td>
            <td><span style="color: #7f8c8d;">${med.category}</span></td>
            <td style="font-weight: bold; color: #2c3e50;">$${med.price.toFixed(2)}</td>
            <td><span class="stock-badge">${med.stockQuantity} units</span></td>
            <td>
                <button class="btn-delete" onclick="deleteMed(${med.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteMed(id) {
    if(confirm("Delete this medicine?")) {
        fetch(`${API_URL}/${id}`, { method: 'DELETE' })
            .then(() => loadMedicines());
    }
}

// Initial Load
loadMedicines();
// Add this at the bottom of script.js
document.getElementById('medicineForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Stop page from refreshing

    const newMedicine = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stockQuantity: parseInt(document.getElementById('stock').value),
        requiresPrescription: false // Default for now
    };

    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedicine)
    })
    .then(res => res.json())
    .then(() => {
        loadMedicines(); // Refresh table
        this.reset();    // Clear form
    });
});