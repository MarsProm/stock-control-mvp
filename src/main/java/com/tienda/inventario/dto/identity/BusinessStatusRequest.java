package com.tienda.inventario.dto.identity;

import jakarta.validation.constraints.NotNull;

public record BusinessStatusRequest(@NotNull Boolean active) {
}
