package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Column(name = "current_stock", nullable = false)
    private long currentStock;

    @Column(name = "minimum_stock", nullable = false)
    private long minimumStock;

    @Column(nullable = false)
    private boolean active;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {
    }

    public Product(String code, String name, String description, BigDecimal price, long minimumStock) {
        updateDetails(code, name, description, price, minimumStock);
        this.currentStock = 0;
        this.active = true;
    }

    public void updateDetails(String code, String name, String description, BigDecimal price, long minimumStock) {
        this.code = normalizeCode(code);
        this.name = name.trim();
        this.description = description == null || description.isBlank() ? null : description.trim();
        this.price = price;
        this.minimumStock = minimumStock;
    }

    public void deactivate() {
        this.active = false;
    }

    public long applyEntry(long quantity) {
        this.currentStock = Math.addExact(this.currentStock, quantity);
        return this.currentStock;
    }

    public long applyExit(long quantity) {
        if (quantity > this.currentStock) {
            throw new IllegalArgumentException("Insufficient stock");
        }
        this.currentStock -= quantity;
        return this.currentStock;
    }

    public boolean isLowStock() {
        return active && currentStock <= minimumStock;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    private static String normalizeCode(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public long getCurrentStock() {
        return currentStock;
    }

    public long getMinimumStock() {
        return minimumStock;
    }

    public boolean isActive() {
        return active;
    }

    public long getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
