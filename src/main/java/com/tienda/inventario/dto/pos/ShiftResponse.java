package com.tienda.inventario.dto.pos;

import com.tienda.inventario.entity.CashShift;
import com.tienda.inventario.entity.ShiftStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ShiftResponse(
        UUID id,
        UUID registerId,
        String registerName,
        UUID cashierUserId,
        ShiftStatus status,
        BigDecimal openingCash,
        BigDecimal expectedCash,
        BigDecimal countedCash,
        BigDecimal difference,
        BigDecimal cashSales,
        BigDecimal cardSales,
        BigDecimal transferSales,
        Instant openedAt,
        Instant closedAt
) {
    public static ShiftResponse from(CashShift shift, BigDecimal cash, BigDecimal card, BigDecimal transfer) {
        return new ShiftResponse(
                shift.getId(), shift.getRegister().getId(), shift.getRegister().getName(), shift.getCashierUserId(),
                shift.getStatus(), shift.getOpeningCash(), shift.getExpectedCash(), shift.getCountedCash(),
                shift.getDifference(), cash, card, transfer, shift.getOpenedAt(), shift.getClosedAt()
        );
    }
}
