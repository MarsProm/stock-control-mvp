package com.tienda.inventario.repository;

import com.tienda.inventario.entity.Business;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface BusinessRepository extends JpaRepository<Business, UUID> {
    boolean existsBySlugIgnoreCase(String slug);
    Optional<Business> findByIdAndActiveTrue(UUID id);
    List<Business> findAllByOrderByNameAsc();
}
