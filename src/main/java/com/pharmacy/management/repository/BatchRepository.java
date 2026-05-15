package com.pharmacy.management.repository;

import com.pharmacy.management.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BatchRepository extends JpaRepository<Batch, Long> {
    // This finds batches for a medicine and sorts them so the oldest/soonest to expire comes first
    List<Batch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);
}