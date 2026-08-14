package com.tienda.inventario.dto.pos;

import com.tienda.inventario.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SalePaymentRequest(
        @NotNull PaymentMethod method,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @DecimalMin("0") BigDecimal tenderedAmount,
        @Size(max = 120) String reference
) {
}
