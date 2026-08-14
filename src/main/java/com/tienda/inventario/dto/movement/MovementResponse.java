package com.tienda.inventario.dto.movement;

import com.tienda.inventario.entity.MovementType;

import java.time.Instant;
import java.util.UUID;

public record MovementResponse(
        UUID id,
        UUID productId,
        MovementType type,
        long quantity,
        String reason,
        long balanceAfter,
        UUID actorUserId,
        UUID saleId,
        Instant createdAt
) {
}
