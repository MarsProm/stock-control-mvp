package com.tienda.inventario.mapper;

import com.tienda.inventario.dto.movement.MovementResponse;
import com.tienda.inventario.entity.StockMovement;
import org.springframework.stereotype.Component;

@Component
public class MovementMapper {

    public MovementResponse toResponse(StockMovement movement) {
        return new MovementResponse(
                movement.getId(),
                movement.getProduct().getId(),
                movement.getType(),
                movement.getQuantity(),
                movement.getReason(),
                movement.getBalanceAfter(),
                movement.getActorUserId(),
                movement.getSale() == null ? null : movement.getSale().getId(),
                movement.getCreatedAt()
        );
    }
}
