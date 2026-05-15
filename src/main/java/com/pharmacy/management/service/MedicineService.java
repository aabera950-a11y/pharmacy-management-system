package com.pharmacy.management.service;

import com.pharmacy.management.model.Batch;
import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.model.Sale; // Import your Sale model
import com.pharmacy.management.repository.BatchRepository;
import com.pharmacy.management.repository.MedicineRepository;
import com.pharmacy.management.repository.SaleRepository; // Import your Sale repository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private SaleRepository saleRepository; // Injecting the repository you have

    @Transactional
    public void sellMedicine(Long medicineId, Integer quantityToSell) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        List<Batch> batches = batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId);

        int remainingToSell = quantityToSell;
        double totalRevenue = 0;
        double totalProfit = 0;

        for (Batch batch : batches) {
            if (remainingToSell <= 0) break;

            int batchQty = batch.getQuantity();
            // How many can we take from THIS specific batch?
            int takenFromThisBatch = Math.min(batchQty, remainingToSell);

            // MATH: Calculate revenue and profit for this specific batch's cost
            totalRevenue += takenFromThisBatch * medicine.getPrice();
            totalProfit += takenFromThisBatch * (medicine.getPrice() - batch.getCostPrice());

            if (batchQty <= remainingToSell) {
                remainingToSell -= batchQty;
                batchRepository.delete(batch); // Batch is now empty
            } else {
                batch.setQuantity(batchQty - remainingToSell);
                batchRepository.save(batch);
                remainingToSell = 0;
            }
        }

        if (remainingToSell > 0) {
            throw new RuntimeException("Not enough stock in batches to complete sale!");
        }

        // --- RECORD THE SALE HISTORY ---
        Sale sale = new Sale();
        sale.setMedicineName(medicine.getName());
        sale.setQuantity(quantityToSell);
        sale.setTotalPrice(totalRevenue);
        sale.setTotalProfit(totalProfit);
        sale.setSaleDate(LocalDateTime.now());

        saleRepository.save(sale); // This uses your SaleRepository
    }

    @Transactional
    public Batch addStock(Long medicineId, Batch newBatch) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found"));

        newBatch.setMedicine(medicine);
        return batchRepository.save(newBatch);
    }
}