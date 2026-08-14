package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "businesses")
public class Business {

    public static final UUID DEFAULT_BUSINESS_ID = UUID.fromString("00000000-0000-0000-0000-000000000100");

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "logo_url", length = 600)
    private String logoUrl;

    @Column(name = "primary_color", nullable = false, length = 7)
    private String primaryColor;

    @Column(name = "accent_color", nullable = false, length = 7)
    private String accentColor;

    @Column(name = "receipt_header", length = 250)
    private String receiptHeader;

    @Column(name = "receipt_footer", length = 250)
    private String receiptFooter;

    @Column(name = "inventory_enabled", nullable = false)
    private boolean inventoryEnabled;

    @Column(name = "pos_enabled", nullable = false)
    private boolean posEnabled;

    @Column(name = "reports_enabled", nullable = false)
    private boolean reportsEnabled;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Business() {
    }

    public Business(String name, String slug) {
        this.name = name.trim();
        this.slug = normalizeSlug(slug);
        this.active = true;
        this.primaryColor = "#334155";
        this.accentColor = "#047857";
        this.inventoryEnabled = true;
        this.posEnabled = true;
        this.reportsEnabled = true;
    }

    public void updateSettings(
            String name,
            String primaryColor,
            String accentColor,
            String receiptHeader,
            String receiptFooter,
            boolean inventoryEnabled,
            boolean posEnabled,
            boolean reportsEnabled
    ) {
        this.name = name.trim();
        this.primaryColor = primaryColor.toUpperCase(Locale.ROOT);
        this.accentColor = accentColor.toUpperCase(Locale.ROOT);
        this.receiptHeader = clean(receiptHeader);
        this.receiptFooter = clean(receiptFooter);
        this.inventoryEnabled = inventoryEnabled;
        this.posEnabled = posEnabled;
        this.reportsEnabled = reportsEnabled;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = clean(logoUrl);
    }

    public void deactivate() {
        this.active = false;
    }

    public void updateActive(boolean active) {
        this.active = active;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeSlug(String value) {
        return value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9-]", "-").replaceAll("-+", "-");
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public boolean isActive() { return active; }
    public String getLogoUrl() { return logoUrl; }
    public String getPrimaryColor() { return primaryColor; }
    public String getAccentColor() { return accentColor; }
    public String getReceiptHeader() { return receiptHeader; }
    public String getReceiptFooter() { return receiptFooter; }
    public boolean isInventoryEnabled() { return inventoryEnabled; }
    public boolean isPosEnabled() { return posEnabled; }
    public boolean isReportsEnabled() { return reportsEnabled; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
