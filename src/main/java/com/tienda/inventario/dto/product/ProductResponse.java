package com.tienda.inventario.dto.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String code,
        String name,
        String description,
        BigDecimal price,
        long currentStock,
        long minimumStock,
        boolean lowStock,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
