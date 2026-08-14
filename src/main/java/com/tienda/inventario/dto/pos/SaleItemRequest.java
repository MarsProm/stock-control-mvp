package com.tienda.inventario.dto.pos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemRequest(
        @NotNull UUID productId,
        @Positive long quantity,
        @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal discountPercent,
        @Size(max = 255) String discountReason
) {
}
