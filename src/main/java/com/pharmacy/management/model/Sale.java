package com.pharmacy.management.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String medicineName;
    private int quantity;
    private double totalPrice;
    private Double totalProfit; // NEW: Actual money earned
    private LocalDateTime saleDate;
}