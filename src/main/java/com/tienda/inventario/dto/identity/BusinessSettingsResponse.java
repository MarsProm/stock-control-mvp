package com.tienda.inventario.dto.identity;

import com.tienda.inventario.entity.Business;

import java.util.UUID;

public record BusinessSettingsResponse(
        UUID id, String name, String slug, String logoUrl, String primaryColor, String accentColor,
        String receiptHeader, String receiptFooter, boolean inventoryEnabled, boolean posEnabled, boolean reportsEnabled
) {
    public static BusinessSettingsResponse from(Business business) {
        return new BusinessSettingsResponse(
                business.getId(), business.getName(), business.getSlug(), business.getLogoUrl(), business.getPrimaryColor(),
                business.getAccentColor(), business.getReceiptHeader(), business.getReceiptFooter(),
                business.isInventoryEnabled(), business.isPosEnabled(), business.isReportsEnabled()
        );
    }
}
