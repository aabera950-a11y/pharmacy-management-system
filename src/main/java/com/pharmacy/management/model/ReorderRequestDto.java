package com.pharmacy.management.model;

public class ReorderRequestDto {
    private String medicineName;
    private int currentStock;
    private String companyName;
    private String contactPerson;
    private String email;
    private double lastCostPrice;

    // Constructor
    public ReorderRequestDto(String medicineName, int currentStock, String companyName,
                             String contactPerson, String email, double lastCostPrice) {
        this.medicineName = medicineName;
        this.currentStock = currentStock;
        this.companyName = companyName;
        this.contactPerson = contactPerson;
        this.email = email;
        this.lastCostPrice = lastCostPrice;
    }

    // Getters and Setters
    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public int getCurrentStock() { return currentStock; }
    public void setCurrentStock(int currentStock) { this.currentStock = currentStock; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public double getLastCostPrice() { return lastCostPrice; }
    public void setLastCostPrice(double lastCostPrice) { this.lastCostPrice = lastCostPrice; }
}