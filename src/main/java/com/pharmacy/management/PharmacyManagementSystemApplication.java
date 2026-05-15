package com.pharmacy.management;

import com.pharmacy.management.model.Batch;
import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.repository.BatchRepository;
import com.pharmacy.management.repository.MedicineRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;

@SpringBootApplication
public class PharmacyManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyManagementSystemApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(MedicineRepository medicineRepository, BatchRepository batchRepository) {
        return args -> {
            // Only add data if the database is completely empty!
            if (medicineRepository.count() == 0) {
                // 1. Create the Medicine container
                Medicine m1 = new Medicine();
                m1.setName("Paracetamol");
                m1.setCategory("Tablet");
                m1.setPrice(5.50);
                // We DON'T call setStockQuantity here anymore.
                medicineRepository.save(m1);

                // 2. Create the first Batch for this medicine
                Batch b1 = new Batch();
                b1.setBatchNumber("B-9988");
                b1.setQuantity(100); // The stock lives here now!
                b1.setCostPrice(2.50);
                b1.setExpiryDate(LocalDate.now().plusYears(1));
                b1.setMedicine(m1); // Link the batch to the medicine

                batchRepository.save(b1);

                System.out.println("Database was empty. Added initial medicine and FIFO batch.");
            } else {
                System.out.println("Database already has data. Skipping initialization.");
            }
        };
    }
}