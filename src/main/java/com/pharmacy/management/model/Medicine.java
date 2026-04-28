package com.pharmacy.management.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;
    private Double price;
    private Integer stockQuantity;

    // FIELDS FOR SUPPLY CHAIN & LOGISTICS
    private LocalDate expiryDate;
    private String distributorName;

    // Batch number is excellent for tracking which specific
    // shipment a medicine came from in case of a recall.
    private String batchNumber;
}