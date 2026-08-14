package com.tienda.inventario.controller;

import com.tienda.inventario.dto.identity.BusinessSummary;
import com.tienda.inventario.dto.identity.BusinessStatusRequest;
import com.tienda.inventario.dto.identity.CreateBusinessRequest;
import com.tienda.inventario.dto.identity.InvitationRequest;
import com.tienda.inventario.dto.identity.MeResponse;
import com.tienda.inventario.dto.identity.MemberResponse;
import com.tienda.inventario.dto.identity.UpdateMemberRequest;
import com.tienda.inventario.service.IdentityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class IdentityController {
    private final IdentityService identityService;

    public IdentityController(IdentityService identityService) { this.identityService = identityService; }

    @GetMapping("/me")
    public MeResponse me() { return identityService.me(); }

    @PostMapping("/platform/businesses")
    public ResponseEntity<BusinessSummary> createBusiness(@Valid @RequestBody CreateBusinessRequest request) {
        BusinessSummary response = identityService.createBusiness(request);
        return ResponseEntity.created(URI.create("/api/v1/platform/businesses/" + response.id())).body(response);
    }

    @GetMapping("/platform/businesses")
    public List<BusinessSummary> businesses() { return identityService.businesses(); }

    @PatchMapping("/platform/businesses/{businessId}")
    public BusinessSummary updateBusinessStatus(@PathVariable UUID businessId,
                                                @Valid @RequestBody BusinessStatusRequest request) {
        return identityService.updateBusinessStatus(businessId, request);
    }

    @PostMapping("/businesses/{businessId}/invitations")
    public ResponseEntity<Map<String, UUID>> invite(@PathVariable UUID businessId, @Valid @RequestBody InvitationRequest request) {
        UUID id = identityService.invite(businessId, request);
        return ResponseEntity.created(URI.create("/api/v1/businesses/" + businessId + "/invitations/" + id))
                .body(Map.of("id", id));
    }

    @GetMapping("/businesses/{businessId}/members")
    public List<MemberResponse> members(@PathVariable UUID businessId) { return identityService.members(businessId); }

    @PatchMapping("/businesses/{businessId}/members/{memberId}")
    public MemberResponse updateMember(@PathVariable UUID businessId, @PathVariable UUID memberId,
                                       @Valid @RequestBody UpdateMemberRequest request) {
        return identityService.updateMember(businessId, memberId, request);
    }
}
