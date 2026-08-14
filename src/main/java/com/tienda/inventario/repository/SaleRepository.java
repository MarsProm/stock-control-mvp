package com.tienda.inventario.repository;

import com.tienda.inventario.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {
    Page<Sale> findByBusiness_Id(UUID businessId, Pageable pageable);
    Optional<Sale> findByIdAndBusiness_Id(UUID id, UUID businessId);
}
