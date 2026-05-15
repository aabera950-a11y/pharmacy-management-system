package com.pharmacy.management.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
public class Batch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String batchNumber;
    private Integer quantity;
    private Double costPrice; // Buying price for this specific batch

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    private String distributorName;
    @Column(name = "supplier_id")
    private Long supplierId;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    @JsonIgnore // Prevents infinite loops during JSON conversion
    private Medicine medicine;
}