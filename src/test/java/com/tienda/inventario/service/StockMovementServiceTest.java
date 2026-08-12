package com.tienda.inventario.service;

import com.tienda.inventario.dto.movement.CreateMovementRequest;
import com.tienda.inventario.entity.MovementType;
import com.tienda.inventario.entity.Product;
import com.tienda.inventario.entity.StockMovement;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.mapper.MovementMapper;
import com.tienda.inventario.repository.ProductRepository;
import com.tienda.inventario.repository.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockMovementServiceTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private StockMovementRepository movementRepository;

    @Test
    void entryUpdatesBalanceAndCreatesHistory() {
        UUID productId = UUID.randomUUID();
        Product product = new Product("CAF-001", "Cafe", null, BigDecimal.ONE, 2);
        when(productRepository.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        when(movementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        StockMovementService service = new StockMovementService(productRepository, movementRepository, new MovementMapper());

        var response = service.create(productId, new CreateMovementRequest(MovementType.ENTRY, 10L, "Inventario inicial"));

        assertThat(response.balanceAfter()).isEqualTo(10);
        assertThat(product.getCurrentStock()).isEqualTo(10);
        verify(movementRepository).save(any(StockMovement.class));
    }

    @Test
    void exitCannotProduceNegativeStock() {
        UUID productId = UUID.randomUUID();
        Product product = new Product("CAF-001", "Cafe", null, BigDecimal.ONE, 2);
        product.applyEntry(3);
        when(productRepository.findByIdForUpdate(productId)).thenReturn(Optional.of(product));
        StockMovementService service = new StockMovementService(productRepository, movementRepository, new MovementMapper());

        assertThatThrownBy(() -> service.create(
                productId,
                new CreateMovementRequest(MovementType.EXIT, 4L, "Venta")
        )).isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("Stock insuficiente");
        assertThat(product.getCurrentStock()).isEqualTo(3);
        verify(movementRepository, never()).save(any());
    }
}
