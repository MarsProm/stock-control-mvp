package com.tienda.inventario.dto.pos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateSaleRequest(
        @NotNull UUID shiftId,
        @NotEmpty List<@Valid SaleItemRequest> items,
        @NotEmpty List<@Valid SalePaymentRequest> payments
) {
}
