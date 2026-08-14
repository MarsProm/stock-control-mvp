package com.tienda.inventario.service;

import com.tienda.inventario.dto.pos.CreateSaleRequest;
import com.tienda.inventario.dto.pos.SaleItemRequest;
import com.tienda.inventario.dto.pos.SalePaymentRequest;
import com.tienda.inventario.entity.Business;
import com.tienda.inventario.entity.BusinessMembership;
import com.tienda.inventario.entity.BusinessRole;
import com.tienda.inventario.entity.CashShift;
import com.tienda.inventario.entity.PaymentMethod;
import com.tienda.inventario.entity.ShiftStatus;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.repository.BusinessCounterRepository;
import com.tienda.inventario.repository.CashShiftRepository;
import com.tienda.inventario.repository.ProductRepository;
import com.tienda.inventario.repository.SaleItemRepository;
import com.tienda.inventario.repository.SalePaymentRepository;
import com.tienda.inventario.repository.SaleRepository;
import com.tienda.inventario.repository.StockMovementRepository;
import com.tienda.inventario.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {
    @Mock AccessService accessService;
    @Mock ProductRepository productRepository;
    @Mock CashShiftRepository shiftRepository;
    @Mock BusinessCounterRepository counterRepository;
    @Mock SaleRepository saleRepository;
    @Mock SaleItemRepository itemRepository;
    @Mock SalePaymentRepository paymentRepository;
    @Mock StockMovementRepository movementRepository;

    private SaleService service;
    private UUID businessId;
    private UUID userId;
    private UUID shiftId;

    @BeforeEach
    void setUp() {
        service = new SaleService(accessService, productRepository, shiftRepository, counterRepository,
                saleRepository, itemRepository, paymentRepository, movementRepository);
        businessId = UUID.randomUUID();
        userId = UUID.randomUUID();
        shiftId = UUID.randomUUID();
    }

    @Test
    void rejectsDiscountAboveCashierLimit() {
        prepareShift(new BigDecimal("5.00"));
        CreateSaleRequest request = request(new BigDecimal("10.00"), "Promocion");

        assertThatThrownBy(() -> service.create(businessId, request))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("descuento");
    }

    @Test
    void rejectsSalesUsingAnotherCashiersShift() {
        BusinessMembership membership = membership(new BigDecimal("10.00"));
        when(accessService.requirePos(businessId, false)).thenReturn(membership);
        when(accessService.currentUser()).thenReturn(new CurrentUser(userId, "cashier@example.com"));
        CashShift shift = mock(CashShift.class);
        when(shift.getStatus()).thenReturn(ShiftStatus.OPEN);
        when(shift.getCashierUserId()).thenReturn(UUID.randomUUID());
        when(shiftRepository.findByIdAndBusiness_Id(shiftId, businessId)).thenReturn(Optional.of(shift));

        assertThatThrownBy(() -> service.create(businessId, request(BigDecimal.ZERO, null)))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("turno propio");
    }

    private void prepareShift(BigDecimal maxDiscount) {
        when(accessService.requirePos(businessId, false)).thenReturn(membership(maxDiscount));
        when(accessService.currentUser()).thenReturn(new CurrentUser(userId, "cashier@example.com"));
        CashShift shift = mock(CashShift.class);
        when(shift.getStatus()).thenReturn(ShiftStatus.OPEN);
        when(shift.getCashierUserId()).thenReturn(userId);
        when(shiftRepository.findByIdAndBusiness_Id(shiftId, businessId)).thenReturn(Optional.of(shift));
    }

    private BusinessMembership membership(BigDecimal maxDiscount) {
        return new BusinessMembership(new Business("Tienda", "tienda"), userId, "cashier@example.com", "Caja",
                BusinessRole.CASHIER, maxDiscount);
    }

    private CreateSaleRequest request(BigDecimal discount, String reason) {
        return new CreateSaleRequest(
                shiftId,
                List.of(new SaleItemRequest(UUID.randomUUID(), 1, discount, reason)),
                List.of(new SalePaymentRequest(PaymentMethod.CASH, BigDecimal.TEN, BigDecimal.TEN, null))
        );
    }
}
