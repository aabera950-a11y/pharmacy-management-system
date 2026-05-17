package com.pharmacy.management.controller;

import com.pharmacy.management.model.Batch;
import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.model.Sale;
import com.pharmacy.management.model.Supplier;
import com.pharmacy.management.model.ReorderRequestDto;
import com.pharmacy.management.repository.MedicineRepository;
import com.pharmacy.management.repository.SaleRepository;
import com.pharmacy.management.repository.SupplierRepository;
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
    private final SupplierRepository supplierRepository; // Added for Supplier Lookups
    private final MedicineService medicineService;

    // Updated constructor to handle all 4 dependencies cleanly
    public MedicineController(MedicineRepository repository,
                              SaleRepository saleRepository,
                              SupplierRepository supplierRepository,
                              MedicineService medicineService) {
        this.repository = repository;
        this.saleRepository = saleRepository;
        this.supplierRepository = supplierRepository;
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

    /**
     * LOW-STOCK AUTOMATED PURChASE ORDERS ENDPOINT
     * Matches your internal project repository names perfectly.
     */
    @GetMapping("/{id}/reorder-details")
    public ResponseEntity<ReorderRequestDto> getReorderDetails(@PathVariable Long id) {
        // 1. Fetch the medicine using your exact 'repository' variable
        Medicine medicine = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine record not found"));

        // 2. Calculate remaining stock levels
        int totalStock = medicine.getBatches() != null ?
                medicine.getBatches().stream().mapToInt(Batch::getQuantity).sum() : 0;

        // 3. System defaults if database references are empty
        String compName = "Legacy/Unknown Vendor";
        String contact = "N/A";
        String emailAddress = "procurement@pharmacy.com";
        double unitCost = 0.0;

        // 4. Trace the latest batch transaction to extract supplier relations
        if (medicine.getBatches() != null && !medicine.getBatches().isEmpty()) {
            Batch latestBatch = medicine.getBatches().get(medicine.getBatches().size() - 1);
            unitCost = latestBatch.getCostPrice();

            if (latestBatch.getSupplierId() != null) {
                Optional<Supplier> linkedSupplier = supplierRepository.findById(latestBatch.getSupplierId());
                if (linkedSupplier.isPresent()) {
                    compName = linkedSupplier.get().getCompanyName();
                    contact = linkedSupplier.get().getContactPerson();
                    emailAddress = linkedSupplier.get().getEmail();
                }
            }
        }

        // 5. Build and return the decoupled DTO container
        ReorderRequestDto dto = new ReorderRequestDto(
                medicine.getName(),
                totalStock,
                compName,
                contact,
                emailAddress,
                unitCost
        );

        return ResponseEntity.ok(dto);
    }
}