package com.tienda.inventario.dto.product;

import jakarta.validation.constraints.AssertFalse;
import jakarta.validation.constraints.NotNull;

public record ProductStatusRequest(@NotNull @AssertFalse Boolean active) {
}
