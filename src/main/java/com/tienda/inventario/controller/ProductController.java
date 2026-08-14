package com.tienda.inventario.controller;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.product.CreateProductRequest;
import com.tienda.inventario.dto.product.ProductResponse;
import com.tienda.inventario.dto.product.ProductStatusRequest;
import com.tienda.inventario.dto.product.UpdateProductRequest;
import com.tienda.inventario.service.ProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/products")
@Tag(name = "Productos")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@PathVariable UUID businessId, @Valid @RequestBody CreateProductRequest request) {
        ProductResponse response = productService.create(businessId, request);
        return ResponseEntity.created(URI.create("/api/v1/businesses/" + businessId + "/products/" + response.id())).body(response);
    }

    @GetMapping("/{productId}")
    public ProductResponse get(@PathVariable UUID businessId, @PathVariable UUID productId) {
        return productService.get(businessId, productId);
    }

    @GetMapping("/by-code")
    public ProductResponse getByCode(@PathVariable UUID businessId, @RequestParam String code) {
        return productService.getByCode(businessId, code);
    }

    @GetMapping
    public PageResponse<ProductResponse> search(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "true") Boolean active,
            @RequestParam(defaultValue = "false") boolean lowStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name,asc") String sort
    ) {
        return productService.search(businessId, query, active, lowStock, page, size, sort);
    }

    @PutMapping("/{productId}")
    public ProductResponse update(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return productService.update(businessId, productId, request);
    }

    @PatchMapping("/{productId}/status")
    public ProductResponse deactivate(
            @PathVariable UUID businessId,
            @PathVariable UUID productId,
            @Valid @RequestBody ProductStatusRequest request
    ) {
        return productService.deactivate(businessId, productId);
    }
}
