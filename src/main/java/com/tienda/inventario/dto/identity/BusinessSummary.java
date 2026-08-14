package com.tienda.inventario.dto.identity;

import com.tienda.inventario.entity.Business;
import com.tienda.inventario.entity.BusinessRole;

import java.math.BigDecimal;
import java.util.UUID;

public record BusinessSummary(
        UUID id,
        String name,
        String slug,
        boolean active,
        String logoUrl,
        String primaryColor,
        String accentColor,
        boolean inventoryEnabled,
        boolean posEnabled,
        boolean reportsEnabled,
        BusinessRole role,
        BigDecimal maxDiscountPercent
) {
    public static BusinessSummary from(Business business, BusinessRole role, BigDecimal maxDiscountPercent) {
        return new BusinessSummary(
                business.getId(), business.getName(), business.getSlug(), business.isActive(), business.getLogoUrl(),
                business.getPrimaryColor(), business.getAccentColor(), business.isInventoryEnabled(),
                business.isPosEnabled(), business.isReportsEnabled(), role, maxDiscountPercent
        );
    }
}
