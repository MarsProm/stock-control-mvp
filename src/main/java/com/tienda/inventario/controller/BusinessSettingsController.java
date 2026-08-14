package com.tienda.inventario.controller;

import com.tienda.inventario.dto.identity.BusinessSettingsRequest;
import com.tienda.inventario.dto.identity.BusinessSettingsResponse;
import com.tienda.inventario.service.BusinessSettingsService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/businesses/{businessId}/settings")
public class BusinessSettingsController {
    private final BusinessSettingsService settingsService;

    public BusinessSettingsController(BusinessSettingsService settingsService) { this.settingsService = settingsService; }

    @GetMapping
    public BusinessSettingsResponse get(@PathVariable UUID businessId) { return settingsService.get(businessId); }

    @PatchMapping
    public BusinessSettingsResponse update(@PathVariable UUID businessId,
                                            @Valid @RequestBody BusinessSettingsRequest request) {
        return settingsService.update(businessId, request);
    }

    @PostMapping(path = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BusinessSettingsResponse logo(@PathVariable UUID businessId, @RequestPart MultipartFile logo) {
        return settingsService.uploadLogo(businessId, logo);
    }
}
