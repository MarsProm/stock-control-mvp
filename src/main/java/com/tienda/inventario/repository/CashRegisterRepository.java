package com.tienda.inventario.repository;

import com.tienda.inventario.entity.CashRegister;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CashRegisterRepository extends JpaRepository<CashRegister, UUID> {
    List<CashRegister> findByBusiness_IdOrderByName(UUID businessId);
    Optional<CashRegister> findByIdAndBusiness_Id(UUID id, UUID businessId);
    boolean existsByBusiness_IdAndNameIgnoreCase(UUID businessId, String name);
}
