package com.tienda.inventario.dto.pos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CloseShiftRequest(@NotNull @DecimalMin("0") BigDecimal countedCash) {
}
