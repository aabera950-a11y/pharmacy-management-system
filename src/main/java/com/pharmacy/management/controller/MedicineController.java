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
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine details) {
        Medicine med = repository.findById(id).orElseThrow();
        med.setName(details.getName());
        med.setCategory(details.getCategory());
        med.setPrice(details.getPrice());
        med.setCostPrice(details.getCostPrice()); // Update cost price
        med.setStockQuantity(details.getStockQuantity());
        med.setExpiryDate(details.getExpiryDate());
        med.setDistributorName(details.getDistributorName());
        return repository.save(med);
    }

    @DeleteMapping("/{id}")
    public String deleteMedicine(@PathVariable Long id) {
        // This is now restricted to ADMIN only via your SecurityConfig/script.js
        repository.deleteById(id);
        return "Medicine with ID " + id + " has been deleted successfully!";
    }

    @PostMapping("/{id}/sell")
    public Medicine sellMedicine(@PathVariable Long id, @RequestParam int quantity) {
        Medicine med = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        if (med.getStockQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock!");
        }

        // Calculate Financials
        double revenue = med.getPrice() * quantity;
        double profit = (med.getPrice() - med.getCostPrice()) * quantity;

        // Update Inventory
        med.setStockQuantity(med.getStockQuantity() - quantity);
        repository.save(med);

        // Record Sale with Profit Math
        Sale sale = new Sale();
        sale.setMedicineName(med.getName());
        sale.setQuantity(quantity);
        sale.setTotalPrice(revenue);
        sale.setTotalProfit(profit); // Save the calculated profit
        sale.setSaleDate(LocalDateTime.now());
        saleRepository.save(sale);

        return med;
    }

    @GetMapping("/sales/history")
    public List<Sale> getSalesHistory() {
        return saleRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }
}