package com.tienda.inventario.security;

import java.util.UUID;

public record CurrentUser(UUID id, String email) {
}
