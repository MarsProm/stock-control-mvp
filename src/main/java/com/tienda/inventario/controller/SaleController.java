package com.tienda.inventario.controller;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.pos.CancelSaleRequest;
import com.tienda.inventario.dto.pos.CreateSaleRequest;
import com.tienda.inventario.dto.pos.SaleResponse;
import com.tienda.inventario.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/sales")
public class SaleController {
    private final SaleService saleService;

    public SaleController(SaleService saleService) { this.saleService = saleService; }

    @PostMapping
    public ResponseEntity<SaleResponse> create(@PathVariable UUID businessId,
                                                @Valid @RequestBody CreateSaleRequest request) {
        SaleResponse response = saleService.create(businessId, request);
        return ResponseEntity.created(URI.create("/api/v1/businesses/" + businessId + "/sales/" + response.id())).body(response);
    }

    @GetMapping
    public PageResponse<SaleResponse> list(@PathVariable UUID businessId,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return saleService.list(businessId, page, size);
    }

    @GetMapping("/{saleId}")
    public SaleResponse get(@PathVariable UUID businessId, @PathVariable UUID saleId) {
        return saleService.get(businessId, saleId);
    }

    @GetMapping("/{saleId}/receipt")
    public SaleResponse receipt(@PathVariable UUID businessId, @PathVariable UUID saleId) {
        return saleService.get(businessId, saleId);
    }

    @PostMapping("/{saleId}/cancel")
    public SaleResponse cancel(@PathVariable UUID businessId, @PathVariable UUID saleId,
                               @Valid @RequestBody CancelSaleRequest request) {
        return saleService.cancel(businessId, saleId, request);
    }
}
