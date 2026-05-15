package com.pharmacy.management.repository;

import com.pharmacy.management.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    // Standard JpaRepository gives us the .save() method automatically
}