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
            // This creates a sample tablet automatically when the app starts
            Medicine sample = new Medicine();
            sample.setName("Paracetamol");
            sample.setCategory("Tablet");
            sample.setPrice(5.50);
            sample.setStockQuantity(100);
            sample.setRequiresPrescription(false);
            sample.setManufacturer("Global Pharma");

            repository.save(sample);
            System.out.println(">>> Pharmacy Database Initialized with Paracetamol!");
        };
    }
}