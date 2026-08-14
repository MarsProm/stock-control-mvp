package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_administrators")
public class PlatformAdministrator {

    @Id
    @Column(name = "auth_user_id")
    private UUID authUserId;

    @Column(length = 320)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PlatformAdministrator() {
    }

    public PlatformAdministrator(UUID authUserId, String email) {
        this.authUserId = authUserId;
        this.email = email;
    }

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getAuthUserId() { return authUserId; }
    public String getEmail() { return email; }
}
