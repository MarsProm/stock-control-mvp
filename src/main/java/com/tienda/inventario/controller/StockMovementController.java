package com.tienda.inventario.controller;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.movement.CreateMovementRequest;
import com.tienda.inventario.dto.movement.MovementResponse;
import com.tienda.inventario.service.StockMovementService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{productId}/movements")
@Tag(name = "Movimientos de stock")
public class StockMovementController {

    private final StockMovementService movementService;

    public StockMovementController(StockMovementService movementService) {
        this.movementService = movementService;
    }

    @PostMapping
    public ResponseEntity<MovementResponse> create(
            @PathVariable UUID productId,
            @Valid @RequestBody CreateMovementRequest request
    ) {
        MovementResponse response = movementService.create(productId, request);
        URI location = URI.create("/api/v1/products/" + productId + "/movements/" + response.id());
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public PageResponse<MovementResponse> history(
            @PathVariable UUID productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return movementService.history(productId, from, to, page, size);
    }
}
