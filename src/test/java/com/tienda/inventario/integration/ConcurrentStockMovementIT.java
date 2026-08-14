package com.tienda.inventario.integration;

import com.tienda.inventario.TestcontainersConfiguration;
import com.tienda.inventario.dto.movement.CreateMovementRequest;
import com.tienda.inventario.dto.product.CreateProductRequest;
import com.tienda.inventario.entity.MovementType;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.service.ProductService;
import com.tienda.inventario.service.StockMovementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class ConcurrentStockMovementIT {

    @Autowired
    private ProductService productService;
    @Autowired
    private StockMovementService movementService;

    @Test
    void createsInitialStockWithItsAuditMovement() {
        var product = productService.create(new CreateProductRequest(
                "7791234567890", "Cafe con stock", null, new BigDecimal("8500.00"), 5L, 12L
        ));

        var history = movementService.history(product.id(), null, null, 0, 20);

        assertThat(product.currentStock()).isEqualTo(12);
        assertThat(history.page().totalElements()).isEqualTo(1);
        assertThat(history.content().getFirst().type()).isEqualTo(MovementType.ENTRY);
        assertThat(history.content().getFirst().reason()).isEqualTo("Inventario inicial");
        assertThat(history.content().getFirst().balanceAfter()).isEqualTo(12);
    }

    @Test
    void onlyOneConcurrentExitCanConsumeTheLastUnit() throws Exception {
        var product = productService.create(new CreateProductRequest(
                "LAST-001", "Ultima unidad", null, BigDecimal.ONE, 0L, null
        ));
        movementService.create(product.id(), new CreateMovementRequest(
                MovementType.ENTRY, 1L, "Inventario inicial"
        ));

        var barrier = new CyclicBarrier(2);
        Callable<Boolean> exit = () -> {
            barrier.await();
            try {
                movementService.create(product.id(), new CreateMovementRequest(
                        MovementType.EXIT, 1L, "Venta concurrente"
                ));
                return true;
            } catch (BusinessConflictException exception) {
                return false;
            }
        };

        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(exit);
            var second = executor.submit(exit);
            assertThat(new boolean[]{first.get(), second.get()}).containsExactlyInAnyOrder(true, false);
        }

        assertThat(productService.get(product.id()).currentStock()).isZero();
        assertThat(movementService.history(product.id(), null, null, 0, 20).page().totalElements()).isEqualTo(2);
    }
}
