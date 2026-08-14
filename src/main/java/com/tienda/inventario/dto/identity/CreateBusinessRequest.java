package com.tienda.inventario.dto.identity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBusinessRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Size(min = 3, max = 80) String slug
) {
}
