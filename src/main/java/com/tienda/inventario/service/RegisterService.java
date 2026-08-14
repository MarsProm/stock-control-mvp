package com.tienda.inventario.service;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.pos.CloseShiftRequest;
import com.tienda.inventario.dto.pos.OpenShiftRequest;
import com.tienda.inventario.dto.pos.RegisterRequest;
import com.tienda.inventario.dto.pos.RegisterResponse;
import com.tienda.inventario.dto.pos.ShiftResponse;
import com.tienda.inventario.dto.pos.UpdateRegisterRequest;
import com.tienda.inventario.entity.Business;
import com.tienda.inventario.entity.CashRegister;
import com.tienda.inventario.entity.CashShift;
import com.tienda.inventario.entity.PaymentMethod;
import com.tienda.inventario.entity.ShiftStatus;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.exception.InvalidRequestException;
import com.tienda.inventario.repository.CashRegisterRepository;
import com.tienda.inventario.repository.CashShiftRepository;
import com.tienda.inventario.repository.SalePaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
public class RegisterService {
    private final AccessService accessService;
    private final CashRegisterRepository registerRepository;
    private final CashShiftRepository shiftRepository;
    private final SalePaymentRepository paymentRepository;

    public RegisterService(AccessService accessService, CashRegisterRepository registerRepository,
                           CashShiftRepository shiftRepository, SalePaymentRepository paymentRepository) {
        this.accessService = accessService;
        this.registerRepository = registerRepository;
        this.shiftRepository = shiftRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public RegisterResponse createRegister(UUID businessId, RegisterRequest request) {
        accessService.requirePos(businessId, true);
        if (registerRepository.existsByBusiness_IdAndNameIgnoreCase(businessId, request.name())) {
            throw new BusinessConflictException("Ya existe una caja con ese nombre");
        }
        Business business = accessService.requireBusiness(businessId);
        return RegisterResponse.from(registerRepository.save(new CashRegister(business, request.name())));
    }

    @Transactional(readOnly = true)
    public List<RegisterResponse> listRegisters(UUID businessId) {
        accessService.requirePos(businessId, false);
        return registerRepository.findByBusiness_IdOrderByName(businessId).stream().map(RegisterResponse::from).toList();
    }

    @Transactional
    public RegisterResponse updateRegister(UUID businessId, UUID registerId, UpdateRegisterRequest request) {
        accessService.requirePos(businessId, true);
        CashRegister register = registerRepository.findByIdAndBusiness_Id(registerId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la caja solicitada"));
        if (!request.active() && shiftRepository.existsByRegister_IdAndStatus(registerId, ShiftStatus.OPEN)) {
            throw new BusinessConflictException("No se puede desactivar una caja con un turno abierto");
        }
        if (!register.getName().equalsIgnoreCase(request.name())
                && registerRepository.existsByBusiness_IdAndNameIgnoreCase(businessId, request.name())) {
            throw new BusinessConflictException("Ya existe una caja con ese nombre");
        }
        register.update(request.name(), request.active());
        return RegisterResponse.from(register);
    }

    @Transactional
    public ShiftResponse open(UUID businessId, UUID registerId, OpenShiftRequest request) {
        accessService.requirePos(businessId, false);
        UUID userId = accessService.currentUser().id();
        if (shiftRepository.findByBusiness_IdAndCashierUserIdAndStatus(businessId, userId, ShiftStatus.OPEN).isPresent()) {
            throw new BusinessConflictException("El usuario ya tiene un turno abierto");
        }
        if (shiftRepository.existsByRegister_IdAndStatus(registerId, ShiftStatus.OPEN)) {
            throw new BusinessConflictException("La caja ya tiene un turno abierto");
        }
        CashRegister register = registerRepository.findByIdAndBusiness_Id(registerId, businessId)
                .filter(CashRegister::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("No existe una caja activa con ese identificador"));
        CashShift shift = shiftRepository.save(new CashShift(
                accessService.requireBusiness(businessId), register, userId, money(request.openingCash())
        ));
        return response(shift);
    }

    @Transactional(readOnly = true)
    public ShiftResponse current(UUID businessId) {
        accessService.requirePos(businessId, false);
        CashShift shift = shiftRepository.findByBusiness_IdAndCashierUserIdAndStatus(
                        businessId, accessService.currentUser().id(), ShiftStatus.OPEN
                )
                .orElseThrow(() -> new ResourceNotFoundException("No hay un turno abierto"));
        return response(shift);
    }

    @Transactional
    public ShiftResponse close(UUID businessId, UUID shiftId, CloseShiftRequest request) {
        accessService.requirePos(businessId, false);
        CashShift shift = shiftRepository.findByIdAndBusiness_Id(shiftId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el turno solicitado"));
        if (shift.getStatus() != ShiftStatus.OPEN) {
            throw new BusinessConflictException("El turno ya esta cerrado");
        }
        boolean ownShift = shift.getCashierUserId().equals(accessService.currentUser().id());
        if (!ownShift) {
            accessService.requireAdmin(businessId);
        }
        shift.close(money(request.countedCash()));
        return response(shift);
    }

    @Transactional(readOnly = true)
    public PageResponse<ShiftResponse> history(UUID businessId, int page, int size) {
        accessService.requireReports(businessId);
        validatePage(page, size);
        Page<CashShift> result = shiftRepository.findByBusiness_Id(
                businessId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "openedAt"))
        );
        return PageResponse.from(result.map(this::response));
    }

    private ShiftResponse response(CashShift shift) {
        return ShiftResponse.from(
                shift,
                total(shift.getId(), PaymentMethod.CASH),
                total(shift.getId(), PaymentMethod.CARD),
                total(shift.getId(), PaymentMethod.TRANSFER)
        );
    }

    private BigDecimal total(UUID shiftId, PaymentMethod method) {
        BigDecimal value = paymentRepository.sumCompletedByShiftAndMethod(shiftId, method);
        return value == null ? BigDecimal.ZERO.setScale(2) : value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
    private static void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new InvalidRequestException("Paginacion invalida: page >= 0 y size entre 1 y 100");
        }
    }
}
