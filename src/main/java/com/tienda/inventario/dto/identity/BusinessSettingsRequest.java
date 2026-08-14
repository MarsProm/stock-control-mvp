package com.tienda.inventario.dto.identity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BusinessSettingsRequest(
        @NotBlank @Size(max = 150) String name,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String primaryColor,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String accentColor,
        @Size(max = 250) String receiptHeader,
        @Size(max = 250) String receiptFooter,
        boolean inventoryEnabled,
        boolean posEnabled,
        boolean reportsEnabled
) {
}
