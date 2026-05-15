package com.pharmacy.management.controller;

import com.pharmacy.management.model.Supplier;
import com.pharmacy.management.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    @Autowired
    private SupplierRepository supplierRepository;

    // GET /api/suppliers - Loads all profiles for the dropdown list and directory
    @GetMapping
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    // POST /api/suppliers - Saves a new supplier profile from the form
    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        Supplier savedSupplier = supplierRepository.save(supplier);
        return ResponseEntity.ok(savedSupplier);
    }
}