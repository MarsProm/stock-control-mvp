package com.tienda.inventario.dto.pos;

import com.tienda.inventario.entity.PaymentMethod;
import com.tienda.inventario.entity.SalePayment;

import java.math.BigDecimal;
import java.util.UUID;

public record SalePaymentResponse(
        UUID id, PaymentMethod method, BigDecimal amount, BigDecimal tenderedAmount, BigDecimal changeAmount, String reference
) {
    public static SalePaymentResponse from(SalePayment payment) {
        return new SalePaymentResponse(
                payment.getId(), payment.getMethod(), payment.getAmount(), payment.getTenderedAmount(),
                payment.getChangeAmount(), payment.getReference()
        );
    }
}
