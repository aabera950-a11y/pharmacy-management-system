package com.pharmacy.management.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Entity
@Data
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;
    private Double price; // Selling Price (usually same across all batches)

    // A Medicine can have multiple batches (The FIFO list)
    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Batch> batches = new ArrayList<>();

    // Helper method to get total stock across all batches
    public Integer getTotalStock() {
        return batches.stream()
                .mapToInt(Batch::getQuantity)
                .sum();
    }
}