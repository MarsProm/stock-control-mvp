package com.tienda.inventario.dto.pos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelSaleRequest(@NotBlank @Size(max = 255) String reason) {
}
