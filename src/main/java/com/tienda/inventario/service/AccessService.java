package com.tienda.inventario.service;

import com.tienda.inventario.entity.Business;
import com.tienda.inventario.entity.BusinessMembership;
import com.tienda.inventario.entity.BusinessRole;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.repository.BusinessMembershipRepository;
import com.tienda.inventario.repository.BusinessRepository;
import com.tienda.inventario.repository.PlatformAdministratorRepository;
import com.tienda.inventario.security.CurrentUser;
import com.tienda.inventario.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class AccessService {

    private final CurrentUserService currentUserService;
    private final BusinessRepository businessRepository;
    private final BusinessMembershipRepository membershipRepository;
    private final PlatformAdministratorRepository platformAdministratorRepository;
    private final boolean securityEnabled;

    public AccessService(
            CurrentUserService currentUserService,
            BusinessRepository businessRepository,
            BusinessMembershipRepository membershipRepository,
            PlatformAdministratorRepository platformAdministratorRepository,
            @Value("${app.security.enabled}") boolean securityEnabled
    ) {
        this.currentUserService = currentUserService;
        this.businessRepository = businessRepository;
        this.membershipRepository = membershipRepository;
        this.platformAdministratorRepository = platformAdministratorRepository;
        this.securityEnabled = securityEnabled;
    }

    public CurrentUser currentUser() {
        return currentUserService.require();
    }

    public boolean isLocalMode() { return !securityEnabled; }

    @Transactional
    public BusinessMembership requireMembership(UUID businessId) {
        CurrentUser user = currentUser();
        if (!securityEnabled) {
            Business business = requireBusiness(businessId);
            return membershipRepository.findByBusiness_IdAndAuthUserIdAndActiveTrue(businessId, user.id())
                    .orElseGet(() -> membershipRepository.save(new BusinessMembership(
                            business, user.id(), user.email(), "Administrador local", BusinessRole.ADMIN, new BigDecimal("100.00")
                    )));
        }
        if (platformAdministratorRepository.existsById(user.id())) {
            throw new AccessDeniedException("El SUPER_ADMIN no opera tiendas");
        }
        return membershipRepository.findByBusiness_IdAndAuthUserIdAndActiveTrue(businessId, user.id())
                .filter(membership -> membership.getBusiness().isActive())
                .orElseThrow(() -> new ResourceNotFoundException("No existe la tienda solicitada"));
    }

    @Transactional(readOnly = true)
    public BusinessMembership requireAdmin(UUID businessId) {
        BusinessMembership membership = requireMembership(businessId);
        if (membership.getRole() != BusinessRole.ADMIN) {
            throw new AccessDeniedException("Se requiere el rol ADMIN");
        }
        return membership;
    }

    @Transactional(readOnly = true)
    public void requirePlatformAdministrator() {
        if (!securityEnabled) {
            return;
        }
        if (!platformAdministratorRepository.existsById(currentUser().id())) {
            throw new AccessDeniedException("Se requiere el rol SUPER_ADMIN");
        }
    }

    @Transactional(readOnly = true)
    public void requireAdminOrPlatformAdministrator(UUID businessId) {
        if (isPlatformAdministrator()) {
            requireBusiness(businessId);
            return;
        }
        requireAdmin(businessId);
    }

    @Transactional(readOnly = true)
    public boolean isPlatformAdministrator() {
        return !securityEnabled || platformAdministratorRepository.existsById(currentUser().id());
    }

    @Transactional(readOnly = true)
    public Business requireBusiness(UUID businessId) {
        return businessRepository.findByIdAndActiveTrue(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la tienda solicitada"));
    }

    @Transactional(readOnly = true)
    public BusinessMembership requireInventory(UUID businessId, boolean admin) {
        BusinessMembership membership = admin ? requireAdmin(businessId) : requireMembership(businessId);
        if (!membership.getBusiness().isInventoryEnabled()) {
            throw new ResourceNotFoundException("El modulo de inventario no esta disponible");
        }
        return membership;
    }

    @Transactional(readOnly = true)
    public BusinessMembership requirePos(UUID businessId, boolean admin) {
        BusinessMembership membership = admin ? requireAdmin(businessId) : requireMembership(businessId);
        if (!membership.getBusiness().isPosEnabled()) {
            throw new ResourceNotFoundException("El modulo de caja no esta disponible");
        }
        return membership;
    }

    @Transactional(readOnly = true)
    public BusinessMembership requireReports(UUID businessId) {
        BusinessMembership membership = requireAdmin(businessId);
        if (!membership.getBusiness().isReportsEnabled()) {
            throw new ResourceNotFoundException("El modulo de reportes no esta disponible");
        }
        return membership;
    }
}
