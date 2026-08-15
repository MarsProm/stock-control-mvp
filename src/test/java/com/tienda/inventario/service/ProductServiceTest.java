package com.tienda.inventario.service;

import com.tienda.inventario.dto.product.CreateProductRequest;
import com.tienda.inventario.entity.Business;
import com.tienda.inventario.entity.Product;
import com.tienda.inventario.entity.StockMovement;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.mapper.ProductMapper;
import com.tienda.inventario.repository.ProductRepository;
import com.tienda.inventario.repository.StockMovementRepository;
import com.tienda.inventario.repository.BusinessRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository repository;

    @Mock
    private StockMovementRepository movementRepository;

    @Mock
    private BusinessRepository businessRepository;

    @Mock
    private AccessService accessService;

    @Test
    void createsAProductWithNormalizedCodeAndZeroStock() {
        when(repository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProductService service = new ProductService(repository, movementRepository, new ProductMapper());

        var response = service.create(new CreateProductRequest(
                " caf-001 ",
                "Cafe molido",
                null,
                new BigDecimal("8500.00"),
                5L,
                null
        ));

        assertThat(response.code()).isEqualTo("CAF-001");
        assertThat(response.currentStock()).isZero();
        assertThat(response.active()).isTrue();
        verify(repository).save(any(Product.class));
    }

    @Test
    void rejectsDuplicateCodes() {
        when(repository.existsByCodeIgnoreCase("CAF-001")).thenReturn(true);
        ProductService service = new ProductService(repository, movementRepository, new ProductMapper());

        assertThatThrownBy(() -> service.create(new CreateProductRequest(
                "CAF-001",
                "Cafe molido",
                null,
                BigDecimal.ONE,
                0L,
                null
        ))).isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("CAF-001");
    }

    @Test
    void createsInitialStockAndMovementTogether() {
        when(repository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(movementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProductService service = new ProductService(repository, movementRepository, new ProductMapper());

        var response = service.create(new CreateProductRequest(
                "7791234567890",
                "Cafe molido",
                null,
                new BigDecimal("8500.00"),
                5L,
                12L
        ));

        assertThat(response.currentStock()).isEqualTo(12);
        verify(movementRepository).save(any(StockMovement.class));
    }

    @Test
    void findsAProductByNormalizedCodeIncludingInactiveOnes() {
        Product product = new Product("7791234567890", "Cafe molido", null, BigDecimal.ONE, 5L);
        product.deactivate();
        when(repository.findByCodeIgnoreCase("7791234567890")).thenReturn(Optional.of(product));
        ProductService service = new ProductService(repository, movementRepository, new ProductMapper());

        var response = service.getByCode(" 7791234567890 ");

        assertThat(response.code()).isEqualTo("7791234567890");
        assertThat(response.active()).isFalse();
    }

    @Test
    void rejectsAnUnknownBarcode() {
        when(repository.findByCodeIgnoreCase("7790000000000")).thenReturn(Optional.empty());
        ProductService service = new ProductService(repository, movementRepository, new ProductMapper());

        assertThatThrownBy(() -> service.getByCode("7790000000000"))
                .hasMessageContaining("7790000000000");
    }

    @Test
    void allowsCashiersToCreateProductsInTheirBusiness() {
        UUID businessId = UUID.randomUUID();
        Business business = mock(Business.class);
        when(business.getId()).thenReturn(businessId);
        when(businessRepository.findByIdAndActiveTrue(businessId)).thenReturn(Optional.of(business));
        when(repository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ProductService service = new ProductService(
                repository, movementRepository, new ProductMapper(), businessRepository, accessService
        );

        service.create(businessId, new CreateProductRequest(
                "CAJ-001", "Producto de caja", null, BigDecimal.ONE, 0L, null
        ));

        verify(accessService).requireInventory(businessId, false);
    }
}
