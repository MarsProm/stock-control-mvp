package com.tienda.inventario.dto.identity;

import java.util.List;
import java.util.UUID;

public record MeResponse(UUID id, String email, boolean platformAdministrator, List<BusinessSummary> businesses) {
}
