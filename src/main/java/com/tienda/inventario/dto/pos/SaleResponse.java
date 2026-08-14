package com.tienda.inventario.dto.pos;

import com.tienda.inventario.entity.Sale;
import com.tienda.inventario.entity.SaleStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SaleResponse(
        UUID id,
        String number,
        SaleStatus status,
        UUID registerId,
        String registerName,
        UUID shiftId,
        UUID cashierUserId,
        BigDecimal subtotal,
        BigDecimal discountTotal,
        BigDecimal total,
        String businessName,
        String logoUrl,
        String primaryColor,
        String accentColor,
        String receiptHeader,
        String receiptFooter,
        List<SaleItemResponse> items,
        List<SalePaymentResponse> payments,
        Instant createdAt,
        Instant cancelledAt,
        String cancellationReason
) {
    public static SaleResponse from(Sale sale, List<SaleItemResponse> items, List<SalePaymentResponse> payments) {
        return new SaleResponse(
                sale.getId(), "V-%08d".formatted(sale.getSaleNumber()), sale.getStatus(), sale.getRegister().getId(),
                sale.getRegister().getName(), sale.getShift().getId(), sale.getCashierUserId(), sale.getSubtotal(),
                sale.getDiscountTotal(), sale.getTotal(), sale.getReceiptSnapshot().getBusinessName(),
                sale.getReceiptSnapshot().getLogoUrl(), sale.getReceiptSnapshot().getPrimaryColor(),
                sale.getReceiptSnapshot().getAccentColor(), sale.getReceiptSnapshot().getReceiptHeader(),
                sale.getReceiptSnapshot().getReceiptFooter(), items, payments, sale.getCreatedAt(),
                sale.getCancelledAt(), sale.getCancellationReason()
        );
    }
}
