package com.tienda.inventario.repository;

import com.tienda.inventario.entity.BusinessMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessMembershipRepository extends JpaRepository<BusinessMembership, UUID> {
    List<BusinessMembership> findByAuthUserIdAndActiveTrueOrderByBusiness_Name(UUID authUserId);
    List<BusinessMembership> findByBusiness_IdOrderByDisplayName(UUID businessId);
    Optional<BusinessMembership> findByBusiness_IdAndAuthUserIdAndActiveTrue(UUID businessId, UUID authUserId);
    Optional<BusinessMembership> findByIdAndBusiness_Id(UUID id, UUID businessId);
    boolean existsByBusiness_IdAndAuthUserId(UUID businessId, UUID authUserId);
    boolean existsByBusiness_IdAndEmailIgnoreCase(UUID businessId, String email);
    boolean existsByEmailIgnoreCase(String email);
}
