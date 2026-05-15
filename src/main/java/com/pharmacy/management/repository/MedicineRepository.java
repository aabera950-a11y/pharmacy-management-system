package com.pharmacy.management.repository;

import com.pharmacy.management.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // Import this!

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    // For the Search Bar (Returns many results)
    List<Medicine> findByNameContainingIgnoreCase(String name);

    // For the FIFO Add Logic (Returns one specific medicine if found)
    Optional<Medicine> findByNameIgnoreCase(String name);
}