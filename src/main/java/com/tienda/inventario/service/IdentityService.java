package com.tienda.inventario.service;

import com.tienda.inventario.dto.identity.BusinessSummary;
import com.tienda.inventario.dto.identity.BusinessStatusRequest;
import com.tienda.inventario.dto.identity.CreateBusinessRequest;
import com.tienda.inventario.dto.identity.InvitationRequest;
import com.tienda.inventario.dto.identity.MeResponse;
import com.tienda.inventario.dto.identity.MemberResponse;
import com.tienda.inventario.dto.identity.UpdateMemberRequest;
import com.tienda.inventario.entity.Business;
import com.tienda.inventario.entity.BusinessCounter;
import com.tienda.inventario.entity.BusinessInvitation;
import com.tienda.inventario.entity.BusinessMembership;
import com.tienda.inventario.entity.InvitationStatus;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.repository.BusinessCounterRepository;
import com.tienda.inventario.repository.BusinessInvitationRepository;
import com.tienda.inventario.repository.BusinessMembershipRepository;
import com.tienda.inventario.repository.BusinessRepository;
import com.tienda.inventario.repository.PlatformAdministratorRepository;
import com.tienda.inventario.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class IdentityService {

    private final AccessService accessService;
    private final BusinessRepository businessRepository;
    private final BusinessMembershipRepository membershipRepository;
    private final BusinessInvitationRepository invitationRepository;
    private final BusinessCounterRepository counterRepository;
    private final PlatformAdministratorRepository platformAdministratorRepository;
    private final SupabaseAdminClient supabaseAdminClient;

    public IdentityService(
            AccessService accessService,
            BusinessRepository businessRepository,
            BusinessMembershipRepository membershipRepository,
            BusinessInvitationRepository invitationRepository,
            BusinessCounterRepository counterRepository,
            PlatformAdministratorRepository platformAdministratorRepository,
            SupabaseAdminClient supabaseAdminClient
    ) {
        this.accessService = accessService;
        this.businessRepository = businessRepository;
        this.membershipRepository = membershipRepository;
        this.invitationRepository = invitationRepository;
        this.counterRepository = counterRepository;
        this.platformAdministratorRepository = platformAdministratorRepository;
        this.supabaseAdminClient = supabaseAdminClient;
    }

    @Transactional
    public MeResponse me() {
        CurrentUser user = accessService.currentUser();
        boolean platformAdministrator = platformAdministratorRepository.existsById(user.id());
        if (!platformAdministrator) {
            acceptPendingInvitation(user);
        }
        if (accessService.isLocalMode()
                && membershipRepository.findByAuthUserIdAndActiveTrueOrderByBusiness_Name(user.id()).isEmpty()) {
            accessService.requireMembership(Business.DEFAULT_BUSINESS_ID);
        }
        List<BusinessSummary> businesses = (platformAdministrator ? List.<BusinessMembership>of()
                : membershipRepository.findByAuthUserIdAndActiveTrueOrderByBusiness_Name(user.id())).stream()
                .filter(membership -> membership.getBusiness().isActive())
                .map(membership -> BusinessSummary.from(
                        membership.getBusiness(), membership.getRole(), membership.getMaxDiscountPercent()
                ))
                .toList();
        return new MeResponse(user.id(), user.email(), platformAdministrator, businesses);
    }

    @Transactional
    public BusinessSummary createBusiness(CreateBusinessRequest request) {
        accessService.requirePlatformAdministrator();
        if (businessRepository.existsBySlugIgnoreCase(request.slug())) {
            throw new BusinessConflictException("Ya existe una tienda con ese identificador");
        }
        Business business = businessRepository.save(new Business(request.name(), request.slug()));
        counterRepository.save(new BusinessCounter(business));
        return BusinessSummary.from(business, null, null);
    }

    @Transactional(readOnly = true)
    public List<BusinessSummary> businesses() {
        accessService.requirePlatformAdministrator();
        return businessRepository.findAllByOrderByNameAsc().stream()
                .map(business -> BusinessSummary.from(business, null, null))
                .toList();
    }

    @Transactional
    public BusinessSummary updateBusinessStatus(UUID businessId, BusinessStatusRequest request) {
        accessService.requirePlatformAdministrator();
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la tienda solicitada"));
        business.updateActive(request.active());
        return BusinessSummary.from(business, null, null);
    }

    @Transactional
    public UUID invite(UUID businessId, InvitationRequest request) {
        accessService.requireAdminOrPlatformAdministrator(businessId);
        if (membershipRepository.existsByBusiness_IdAndEmailIgnoreCase(businessId, request.email())) {
            throw new BusinessConflictException("El usuario ya pertenece a la tienda");
        }
        if (invitationRepository.existsByBusiness_IdAndEmailIgnoreCaseAndStatus(
                businessId, request.email(), InvitationStatus.PENDING
        )) {
            throw new BusinessConflictException("Ya existe una invitacion pendiente para este email");
        }
        boolean knownUser = membershipRepository.existsByEmailIgnoreCase(request.email());
        Business business = accessService.requireBusiness(businessId);
        BusinessInvitation invitation = invitationRepository.save(new BusinessInvitation(
                business, request.email(), request.displayName(), request.role(), request.maxDiscountPercent(),
                accessService.currentUser().id()
        ));
        if (!knownUser) {
            supabaseAdminClient.invite(request.email());
        }
        return invitation.getId();
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> members(UUID businessId) {
        accessService.requireAdmin(businessId);
        return membershipRepository.findByBusiness_IdOrderByDisplayName(businessId).stream().map(MemberResponse::from).toList();
    }

    @Transactional
    public MemberResponse updateMember(UUID businessId, UUID memberId, UpdateMemberRequest request) {
        accessService.requireAdmin(businessId);
        BusinessMembership member = membershipRepository.findByIdAndBusiness_Id(memberId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el usuario solicitado"));
        member.update(request.role(), request.active(), request.maxDiscountPercent(), request.displayName());
        return MemberResponse.from(member);
    }

    private void acceptPendingInvitation(CurrentUser user) {
        if (user.email() == null) {
            return;
        }
        invitationRepository.findFirstByEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(user.email(), InvitationStatus.PENDING)
                .ifPresent(invitation -> {
                    if (!membershipRepository.existsByBusiness_IdAndAuthUserId(invitation.getBusiness().getId(), user.id())) {
                        membershipRepository.save(new BusinessMembership(
                                invitation.getBusiness(), user.id(), user.email(), invitation.getDisplayName(),
                                invitation.getRole(), invitation.getMaxDiscountPercent()
                        ));
                    }
                    invitation.accept(user.id());
                });
    }
}
