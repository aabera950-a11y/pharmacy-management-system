package com.pharmacy.management.controller;

import com.pharmacy.management.model.Batch;
import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.model.Sale;
import com.pharmacy.management.repository.MedicineRepository;
import com.pharmacy.management.repository.SaleRepository;
import com.pharmacy.management.service.MedicineService;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineRepository repository;
    private final SaleRepository saleRepository;
    private final MedicineService medicineService;

    public MedicineController(MedicineRepository repository,
                              SaleRepository saleRepository,
                              MedicineService medicineService) {
        this.repository = repository;
        this.saleRepository = saleRepository;
        this.medicineService = medicineService;
    }

    @GetMapping
    public List<Medicine> getAllMedicines() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    @GetMapping("/search")
    public List<Medicine> searchMedicine(@RequestParam String name) {
        return repository.findByNameContainingIgnoreCase(name);
    }

    /**
     * SMART ADD: If medicine exists by name, add a new batch.
     * If not, create the medicine AND the first batch.
     */
    @PostMapping
    @Transactional
    public Medicine addMedicine(@RequestBody Medicine medicineData) {
        Optional<Medicine> existingMed = repository.findByNameIgnoreCase(medicineData.getName());

        if (existingMed.isPresent()) {
            // Case A: Medicine exists, add a new batch to it
            Medicine med = existingMed.get();
            if (medicineData.getBatches() != null && !medicineData.getBatches().isEmpty()) {
                medicineService.addStock(med.getId(), medicineData.getBatches().get(0));
            }
            return med;
        } else {
            // Case B: New medicine entirely
            if (medicineData.getBatches() != null) {
                medicineData.getBatches().forEach(batch -> batch.setMedicine(medicineData));
            }
            return repository.save(medicineData);
        }
    }

    /**
     * ADMIN ONLY: Dedicated endpoint to update only the selling price.
     * This corresponds to the "Set Price" button in your JavaScript.
     */
    @PatchMapping("/{id}/set-price")
    public ResponseEntity<Medicine> setPrice(@PathVariable Long id, @RequestParam double price) {
        Medicine med = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        med.setPrice(price);
        repository.save(med);
        return ResponseEntity.ok(med);
    }

    @PutMapping("/{id}")
    public Medicine updateMedicine(@PathVariable Long id, @RequestBody Medicine details) {
        Medicine med = repository.findById(id).orElseThrow();
        med.setName(details.getName());
        med.setCategory(details.getCategory());
        med.setPrice(details.getPrice());
        return repository.save(med);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMedicine(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok("Medicine deleted successfully!");
    }

    /**
     * FIFO SALE: Calls the Service to handle batch deduction
     */
    @PostMapping("/{id}/sell")
    public ResponseEntity<?> sellMedicine(@PathVariable Long id, @RequestParam int quantity) {
        try {
            medicineService.sellMedicine(id, quantity);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/sales/history")
    public List<Sale> getSalesHistory() {
        return saleRepository.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }
}