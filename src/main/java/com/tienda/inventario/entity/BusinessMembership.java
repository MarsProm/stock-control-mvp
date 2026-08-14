package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "business_memberships")
public class BusinessMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @Column(name = "auth_user_id", nullable = false)
    private UUID authUserId;

    @Column(nullable = false, length = 320)
    private String email;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BusinessRole role;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "max_discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxDiscountPercent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BusinessMembership() {
    }

    public BusinessMembership(Business business, UUID authUserId, String email, String displayName, BusinessRole role, BigDecimal maxDiscountPercent) {
        this.business = business;
        this.authUserId = authUserId;
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.displayName = displayName.trim();
        this.role = role;
        this.maxDiscountPercent = maxDiscountPercent;
        this.active = true;
    }

    public void update(BusinessRole role, boolean active, BigDecimal maxDiscountPercent, String displayName) {
        this.role = role;
        this.active = active;
        this.maxDiscountPercent = maxDiscountPercent;
        this.displayName = displayName.trim();
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public Business getBusiness() { return business; }
    public UUID getAuthUserId() { return authUserId; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public BusinessRole getRole() { return role; }
    public boolean isActive() { return active; }
    public BigDecimal getMaxDiscountPercent() { return maxDiscountPercent; }
}
