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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessServiceTest {
    @Mock CurrentUserService currentUserService;
    @Mock BusinessRepository businessRepository;
    @Mock BusinessMembershipRepository membershipRepository;
    @Mock PlatformAdministratorRepository platformAdministratorRepository;

    private AccessService service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        service = new AccessService(currentUserService, businessRepository, membershipRepository,
                platformAdministratorRepository, true);
        userId = UUID.randomUUID();
        when(currentUserService.require()).thenReturn(new CurrentUser(userId, "user@example.com"));
    }

    @Test
    void hidesABusinessWhenTheUserHasNoMembership() {
        UUID businessId = UUID.randomUUID();
        when(membershipRepository.findByBusiness_IdAndAuthUserIdAndActiveTrue(businessId, userId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireMembership(businessId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No existe la tienda solicitada");
    }

    @Test
    void rejectsAdministrativeActionsFromCashiers() {
        Business business = new Business("Tienda", "tienda");
        UUID businessId = UUID.randomUUID();
        BusinessMembership membership = new BusinessMembership(
                business, userId, "user@example.com", "Caja", BusinessRole.CASHIER, BigDecimal.ZERO
        );
        when(membershipRepository.findByBusiness_IdAndAuthUserIdAndActiveTrue(businessId, userId))
                .thenReturn(Optional.of(membership));

        assertThatThrownBy(() -> service.requireAdmin(businessId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void allowsCashiersToUseEnabledInventoryAndReports() {
        Business business = new Business("Tienda", "tienda");
        UUID businessId = UUID.randomUUID();
        BusinessMembership membership = new BusinessMembership(
                business, userId, "user@example.com", "Caja", BusinessRole.CASHIER, BigDecimal.ZERO
        );
        when(membershipRepository.findByBusiness_IdAndAuthUserIdAndActiveTrue(businessId, userId))
                .thenReturn(Optional.of(membership));

        assertThat(service.requireInventory(businessId, false)).isSameAs(membership);
        assertThat(service.requireReports(businessId, false)).isSameAs(membership);
    }
}
