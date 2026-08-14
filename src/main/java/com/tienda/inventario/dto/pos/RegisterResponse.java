package com.tienda.inventario.dto.pos;

import com.tienda.inventario.entity.CashRegister;

import java.util.UUID;

public record RegisterResponse(UUID id, String name, boolean active) {
    public static RegisterResponse from(CashRegister register) {
        return new RegisterResponse(register.getId(), register.getName(), register.isActive());
    }
}
