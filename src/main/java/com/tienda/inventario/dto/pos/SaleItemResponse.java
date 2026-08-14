package com.tienda.inventario.dto.pos;

import com.tienda.inventario.entity.SaleItem;

import java.math.BigDecimal;
import java.util.UUID;

public record SaleItemResponse(
        UUID id, UUID productId, String code, String name, BigDecimal unitPrice, long quantity,
        BigDecimal discountPercent, String discountReason, BigDecimal subtotal, BigDecimal total
) {
    public static SaleItemResponse from(SaleItem item) {
        return new SaleItemResponse(
                item.getId(), item.getProduct().getId(), item.getProductCode(), item.getProductName(), item.getUnitPrice(),
                item.getQuantity(), item.getDiscountPercent(), item.getDiscountReason(), item.getLineSubtotal(), item.getLineTotal()
        );
    }
}
