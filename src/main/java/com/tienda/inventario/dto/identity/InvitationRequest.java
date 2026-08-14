package com.tienda.inventario.dto.identity;

import com.tienda.inventario.entity.BusinessRole;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record InvitationRequest(
        @Email @NotBlank @Size(max = 320) String email,
        @NotBlank @Size(max = 150) String displayName,
        @NotNull BusinessRole role,
        @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal maxDiscountPercent
) {
}
