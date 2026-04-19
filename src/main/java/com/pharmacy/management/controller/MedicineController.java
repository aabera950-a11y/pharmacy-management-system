package com.pharmacy.management.controller;

import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.repository.MedicineRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineRepository repository;

    public MedicineController(MedicineRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Medicine> getAll() {
        return repository.findAll();
    }
    @DeleteMapping("/{id}")
    public String deleteMedicine(@PathVariable Long id) {
        repository.deleteById(id);
        return "Medicine with ID " + id + " has been deleted successfully!";
    }
}