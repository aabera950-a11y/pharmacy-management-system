package com.pharmacy.management.repository;

import com.pharmacy.management.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SaleRepository extends JpaRepository<Sale, Long> {
}