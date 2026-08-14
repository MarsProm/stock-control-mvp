package com.tienda.inventario.repository;

import com.tienda.inventario.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);

    Optional<Product> findByCodeIgnoreCase(String code);

    boolean existsByBusiness_IdAndCodeIgnoreCase(UUID businessId, String code);

    boolean existsByBusiness_IdAndCodeIgnoreCaseAndIdNot(UUID businessId, String code, UUID id);

    Optional<Product> findByBusiness_IdAndCodeIgnoreCase(UUID businessId, String code);

    Optional<Product> findByIdAndBusiness_Id(UUID id, UUID businessId);

    boolean existsByIdAndBusiness_Id(UUID id, UUID businessId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id and p.business.id = :businessId")
    Optional<Product> findByIdForUpdate(@Param("businessId") UUID businessId, @Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") UUID id);
}
