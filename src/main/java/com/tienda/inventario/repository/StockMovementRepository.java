package com.tienda.inventario.repository;

import com.tienda.inventario.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    Page<StockMovement> findByProduct_Id(UUID productId, Pageable pageable);

    Page<StockMovement> findByProduct_IdAndCreatedAtGreaterThanEqual(UUID productId, Instant from, Pageable pageable);

    Page<StockMovement> findByProduct_IdAndCreatedAtLessThanEqual(UUID productId, Instant to, Pageable pageable);

    Page<StockMovement> findByProduct_IdAndCreatedAtBetween(
            UUID productId,
            Instant from,
            Instant to,
            Pageable pageable
    );
}
