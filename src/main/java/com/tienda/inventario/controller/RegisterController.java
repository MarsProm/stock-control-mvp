package com.tienda.inventario.controller;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.pos.CloseShiftRequest;
import com.tienda.inventario.dto.pos.OpenShiftRequest;
import com.tienda.inventario.dto.pos.RegisterRequest;
import com.tienda.inventario.dto.pos.RegisterResponse;
import com.tienda.inventario.dto.pos.ShiftResponse;
import com.tienda.inventario.dto.pos.UpdateRegisterRequest;
import com.tienda.inventario.service.RegisterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}")
public class RegisterController {
    private final RegisterService registerService;

    public RegisterController(RegisterService registerService) { this.registerService = registerService; }

    @PostMapping("/registers")
    public ResponseEntity<RegisterResponse> createRegister(@PathVariable UUID businessId,
                                                            @Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = registerService.createRegister(businessId, request);
        return ResponseEntity.created(URI.create("/api/v1/businesses/" + businessId + "/registers/" + response.id())).body(response);
    }

    @GetMapping("/registers")
    public List<RegisterResponse> registers(@PathVariable UUID businessId) {
        return registerService.listRegisters(businessId);
    }

    @PatchMapping("/registers/{registerId}")
    public RegisterResponse updateRegister(@PathVariable UUID businessId, @PathVariable UUID registerId,
                                           @Valid @RequestBody UpdateRegisterRequest request) {
        return registerService.updateRegister(businessId, registerId, request);
    }

    @PostMapping("/registers/{registerId}/shifts")
    public ResponseEntity<ShiftResponse> open(@PathVariable UUID businessId, @PathVariable UUID registerId,
                                               @Valid @RequestBody OpenShiftRequest request) {
        ShiftResponse response = registerService.open(businessId, registerId, request);
        return ResponseEntity.created(URI.create("/api/v1/businesses/" + businessId + "/shifts/" + response.id())).body(response);
    }

    @GetMapping("/shifts/current")
    public ShiftResponse current(@PathVariable UUID businessId) { return registerService.current(businessId); }

    @PostMapping("/shifts/{shiftId}/close")
    public ShiftResponse close(@PathVariable UUID businessId, @PathVariable UUID shiftId,
                               @Valid @RequestBody CloseShiftRequest request) {
        return registerService.close(businessId, shiftId, request);
    }

    @GetMapping("/shifts")
    public PageResponse<ShiftResponse> history(@PathVariable UUID businessId,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return registerService.history(businessId, page, size);
    }
}
