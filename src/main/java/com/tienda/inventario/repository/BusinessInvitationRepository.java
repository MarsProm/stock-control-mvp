package com.tienda.inventario.repository;

import com.tienda.inventario.entity.BusinessInvitation;
import com.tienda.inventario.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessInvitationRepository extends JpaRepository<BusinessInvitation, UUID> {
    Optional<BusinessInvitation> findFirstByEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(String email, InvitationStatus status);
    List<BusinessInvitation> findByBusiness_IdOrderByCreatedAtDesc(UUID businessId);
    boolean existsByBusiness_IdAndEmailIgnoreCaseAndStatus(UUID businessId, String email, InvitationStatus status);
}
