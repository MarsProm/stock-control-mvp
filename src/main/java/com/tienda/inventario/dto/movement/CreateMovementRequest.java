package com.tienda.inventario.dto.movement;

import com.tienda.inventario.entity.MovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateMovementRequest(
        @NotNull MovementType type,
        @NotNull @Positive Long quantity,
        @NotBlank @Size(min = 3, max = 255) String reason
) {
}
