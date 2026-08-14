package com.tienda.inventario.dto.identity;

import com.tienda.inventario.entity.BusinessMembership;
import com.tienda.inventario.entity.BusinessRole;

import java.math.BigDecimal;
import java.util.UUID;

public record MemberResponse(
        UUID id,
        UUID userId,
        String email,
        String displayName,
        BusinessRole role,
        boolean active,
        BigDecimal maxDiscountPercent
) {
    public static MemberResponse from(BusinessMembership membership) {
        return new MemberResponse(
                membership.getId(), membership.getAuthUserId(), membership.getEmail(), membership.getDisplayName(),
                membership.getRole(), membership.isActive(), membership.getMaxDiscountPercent()
        );
    }
}
