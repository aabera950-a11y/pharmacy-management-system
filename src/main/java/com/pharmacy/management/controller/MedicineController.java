package com.pharmacy.management.controller;

import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.model.Sale;
import com.pharmacy.management.repository.MedicineRepository;
import com.pharmacy.management.repository.SaleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineRepository repository;
    private final SaleRepository saleRepository;

    public MedicineController(MedicineRepository repository, SaleRepository saleRepository) {
        this.repository = repository;
        this.saleRepository = saleRepository;
    }

    @GetMapping
    public List<Medicine> getAllMedicines() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @GetMapping("/search")
    public List<Medicine> searchMedicine(@RequestParam String name) {
        return repository.findByNameContainingIgnoreCase(name);
    }

    @PostMapping
    public Medicine addMedicine(@RequestBody Medicine medicine) {
        // When the Keeper adds new stock, this saves the whole object including Expiry and Distributor
        return repository.save(medicine);
    }

    @PutMapping("/{id}")
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine medicineDetails) {
        Medicine medicine = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + id));

        // UPDATED LOGIC: Map the new Logistics fields
        medicine.setName(medicineDetails.getName());
        medicine.setCategory(medicineDetails.getCategory());
        medicine.setPrice(medicineDetails.getPrice());
        medicine.setStockQuantity(medicineDetails.getStockQuantity());

        // Ensure these match your Medicine.java field names exactly
        medicine.setExpiryDate(medicineDetails.getExpiryDate());
        medicine.setDistributorName(medicineDetails.getDistributorName());
        medicine.setBatchNumber(medicineDetails.getBatchNumber());

        return repository.save(medicine);
    }

    @DeleteMapping("/{id}")
    public String deleteMedicine(@PathVariable Long id) {
        // This is now restricted to ADMIN only via your SecurityConfig/script.js
        repository.deleteById(id);
        return "Medicine with ID " + id + " has been deleted successfully!";
    }

    @PostMapping("/{id}/sell")
    public Medicine sellMedicine(@PathVariable Long id, @RequestParam int quantity) {
        Medicine medicine = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        if (medicine.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock!");
        }

        // Subtract from stock
        medicine.setStockQuantity(medicine.getStockQuantity() - quantity);
        repository.save(medicine);

        // CREATE SALE RECORD
        Sale sale = new Sale();
        sale.setMedicineName(medicine.getName());
        sale.setQuantity(quantity);
        sale.setTotalPrice(medicine.getPrice() * quantity);
        sale.setSaleDate(LocalDateTime.now());

        saleRepository.save(sale);

        return medicine;
    }

    @GetMapping("/sales/history")
    public List<Sale> getSalesHistory() {
        return saleRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }
}