package com.tienda.inventario.repository;

import com.tienda.inventario.entity.CashShift;
import com.tienda.inventario.entity.ShiftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CashShiftRepository extends JpaRepository<CashShift, UUID> {
    Optional<CashShift> findByBusiness_IdAndCashierUserIdAndStatus(UUID businessId, UUID cashierUserId, ShiftStatus status);
    Optional<CashShift> findByIdAndBusiness_Id(UUID id, UUID businessId);
    boolean existsByRegister_IdAndStatus(UUID registerId, ShiftStatus status);
    Page<CashShift> findByBusiness_Id(UUID businessId, Pageable pageable);
}
