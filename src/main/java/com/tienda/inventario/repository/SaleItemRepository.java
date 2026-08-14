package com.tienda.inventario.repository;

import com.tienda.inventario.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {
    List<SaleItem> findBySale_IdOrderById(UUID saleId);
}
