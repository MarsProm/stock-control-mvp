package com.tienda.inventario.repository;

import com.tienda.inventario.entity.BusinessCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface BusinessCounterRepository extends JpaRepository<BusinessCounter, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select counter from BusinessCounter counter where counter.businessId = :businessId")
    Optional<BusinessCounter> findForUpdate(@Param("businessId") UUID businessId);
}
