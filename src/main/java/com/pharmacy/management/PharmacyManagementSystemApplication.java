package com.pharmacy.management;

import com.pharmacy.management.model.Medicine;
import com.pharmacy.management.repository.MedicineRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class PharmacyManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyManagementSystemApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(MedicineRepository repository) {
        return args -> {
            // Only add data if the database is completely empty!
            if (repository.count() == 0) {
                Medicine m1 = new Medicine();
                m1.setName("Paracetamol");
                m1.setCategory("Tablet");
                m1.setPrice(5.50);
                m1.setStockQuantity(100);
                repository.save(m1);
                System.out.println("Database was empty. Added initial data.");
            } else {
                System.out.println("Database already has data. Skipping initialization.");
            }
        };
    }
}