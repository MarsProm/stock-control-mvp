package com.tienda.inventario.service;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.pos.CancelSaleRequest;
import com.tienda.inventario.dto.pos.CreateSaleRequest;
import com.tienda.inventario.dto.pos.SaleItemRequest;
import com.tienda.inventario.dto.pos.SaleItemResponse;
import com.tienda.inventario.dto.pos.SalePaymentRequest;
import com.tienda.inventario.dto.pos.SalePaymentResponse;
import com.tienda.inventario.dto.pos.SaleResponse;
import com.tienda.inventario.entity.BusinessCounter;
import com.tienda.inventario.entity.BusinessMembership;
import com.tienda.inventario.entity.CashShift;
import com.tienda.inventario.entity.MovementType;
import com.tienda.inventario.entity.PaymentMethod;
import com.tienda.inventario.entity.Product;
import com.tienda.inventario.entity.Sale;
import com.tienda.inventario.entity.SaleItem;
import com.tienda.inventario.entity.SalePayment;
import com.tienda.inventario.entity.SaleStatus;
import com.tienda.inventario.entity.ShiftStatus;
import com.tienda.inventario.entity.StockMovement;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.exception.InvalidRequestException;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.repository.BusinessCounterRepository;
import com.tienda.inventario.repository.CashShiftRepository;
import com.tienda.inventario.repository.ProductRepository;
import com.tienda.inventario.repository.SaleItemRepository;
import com.tienda.inventario.repository.SalePaymentRepository;
import com.tienda.inventario.repository.SaleRepository;
import com.tienda.inventario.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class SaleService {
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final AccessService accessService;
    private final ProductRepository productRepository;
    private final CashShiftRepository shiftRepository;
    private final BusinessCounterRepository counterRepository;
    private final SaleRepository saleRepository;
    private final SaleItemRepository itemRepository;
    private final SalePaymentRepository paymentRepository;
    private final StockMovementRepository movementRepository;

    public SaleService(AccessService accessService, ProductRepository productRepository,
                       CashShiftRepository shiftRepository, BusinessCounterRepository counterRepository,
                       SaleRepository saleRepository, SaleItemRepository itemRepository,
                       SalePaymentRepository paymentRepository, StockMovementRepository movementRepository) {
        this.accessService = accessService;
        this.productRepository = productRepository;
        this.shiftRepository = shiftRepository;
        this.counterRepository = counterRepository;
        this.saleRepository = saleRepository;
        this.itemRepository = itemRepository;
        this.paymentRepository = paymentRepository;
        this.movementRepository = movementRepository;
    }

    @Transactional
    public SaleResponse create(UUID businessId, CreateSaleRequest request) {
        BusinessMembership membership = accessService.requirePos(businessId, false);
        UUID userId = accessService.currentUser().id();
        CashShift shift = shiftRepository.findByIdAndBusiness_Id(request.shiftId(), businessId)
                .filter(candidate -> candidate.getStatus() == ShiftStatus.OPEN && candidate.getCashierUserId().equals(userId))
                .orElseThrow(() -> new BusinessConflictException("La venta requiere un turno propio abierto"));

        Set<UUID> productIds = new HashSet<>();
        List<CalculatedItem> calculatedItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        for (SaleItemRequest itemRequest : request.items()) {
            if (!productIds.add(itemRequest.productId())) {
                throw new InvalidRequestException("Cada producto debe aparecer una sola vez en la venta");
            }
            BigDecimal discountPercent = percent(itemRequest.discountPercent());
            if (discountPercent.compareTo(membership.getMaxDiscountPercent()) > 0) {
                throw new BusinessConflictException("El descuento supera el limite autorizado para el cajero");
            }
            if (discountPercent.signum() > 0 && (itemRequest.discountReason() == null || itemRequest.discountReason().isBlank())) {
                throw new InvalidRequestException("El motivo es obligatorio cuando se aplica un descuento");
            }
            Product product = productRepository.findByIdForUpdate(businessId, itemRequest.productId())
                    .filter(Product::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("No existe un producto activo con id " + itemRequest.productId()));
            BigDecimal lineSubtotal = money(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity())));
            BigDecimal lineDiscount = money(lineSubtotal.multiply(discountPercent).divide(ONE_HUNDRED, 4, RoundingMode.HALF_UP));
            BigDecimal lineTotal = money(lineSubtotal.subtract(lineDiscount));
            calculatedItems.add(new CalculatedItem(product, itemRequest, lineSubtotal, lineTotal));
            subtotal = subtotal.add(lineSubtotal);
            total = total.add(lineTotal);
        }
        subtotal = money(subtotal);
        total = money(total);
        validatePayments(request.payments(), total);

        BusinessCounter counter = counterRepository.findForUpdate(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el contador de ventas de la tienda"));
        Sale sale = saleRepository.save(new Sale(
                accessService.requireBusiness(businessId), shift.getRegister(), shift, userId, counter.takeNextSaleNumber(),
                subtotal, subtotal.subtract(total), total
        ));

        List<SaleItem> items = new ArrayList<>();
        for (CalculatedItem calculated : calculatedItems) {
            long balance;
            try {
                balance = calculated.product().applyExit(calculated.request().quantity());
            } catch (IllegalArgumentException exception) {
                throw new BusinessConflictException("Stock insuficiente para " + calculated.product().getName());
            }
            SaleItem item = itemRepository.save(new SaleItem(
                    sale, calculated.product(), calculated.request().quantity(), percent(calculated.request().discountPercent()),
                    calculated.request().discountReason(), calculated.subtotal(), calculated.total()
            ));
            movementRepository.save(new StockMovement(
                    calculated.product(), MovementType.EXIT, calculated.request().quantity(),
                    "Venta " + "V-%08d".formatted(sale.getSaleNumber()), balance, userId, sale
            ));
            items.add(item);
        }

        List<SalePayment> payments = new ArrayList<>();
        for (SalePaymentRequest paymentRequest : request.payments()) {
            BigDecimal amount = money(paymentRequest.amount());
            BigDecimal tendered = paymentRequest.tenderedAmount() == null ? null : money(paymentRequest.tenderedAmount());
            BigDecimal change = paymentRequest.method() == PaymentMethod.CASH
                    ? money(tendered.subtract(amount))
                    : BigDecimal.ZERO.setScale(2);
            SalePayment payment = paymentRepository.save(new SalePayment(
                    sale, paymentRequest.method(), amount, tendered, change, paymentRequest.reference()
            ));
            if (paymentRequest.method() == PaymentMethod.CASH) {
                shift.addCash(amount);
            }
            payments.add(payment);
        }
        return response(sale, items, payments);
    }

    @Transactional(readOnly = true)
    public SaleResponse get(UUID businessId, UUID saleId) {
        accessService.requirePos(businessId, false);
        Sale sale = saleRepository.findByIdAndBusiness_Id(saleId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la venta solicitada"));
        return response(sale, itemRepository.findBySale_IdOrderById(saleId), paymentRepository.findBySale_IdOrderById(saleId));
    }

    @Transactional(readOnly = true)
    public PageResponse<SaleResponse> list(UUID businessId, int page, int size) {
        accessService.requireReports(businessId, false);
        if (page < 0 || size < 1 || size > 100) {
            throw new InvalidRequestException("Paginacion invalida: page >= 0 y size entre 1 y 100");
        }
        Page<Sale> result = saleRepository.findByBusiness_Id(
                businessId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return PageResponse.from(result.map(sale -> response(
                sale, itemRepository.findBySale_IdOrderById(sale.getId()), paymentRepository.findBySale_IdOrderById(sale.getId())
        )));
    }

    @Transactional
    public SaleResponse cancel(UUID businessId, UUID saleId, CancelSaleRequest request) {
        accessService.requirePos(businessId, true);
        UUID administratorId = accessService.currentUser().id();
        Sale sale = saleRepository.findByIdAndBusiness_Id(saleId, businessId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la venta solicitada"));
        if (sale.getStatus() != SaleStatus.COMPLETED) {
            throw new BusinessConflictException("La venta ya esta anulada");
        }
        if (sale.getShift().getStatus() != ShiftStatus.OPEN) {
            throw new BusinessConflictException("La venta no puede anularse despues del cierre del turno");
        }
        List<SaleItem> items = itemRepository.findBySale_IdOrderById(saleId);
        for (SaleItem item : items) {
            Product product = productRepository.findByIdForUpdate(businessId, item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("No existe el producto de la venta"));
            long balance = product.applyEntry(item.getQuantity());
            movementRepository.save(new StockMovement(
                    product, MovementType.ENTRY, item.getQuantity(), "Anulacion " + "V-%08d".formatted(sale.getSaleNumber()),
                    balance, administratorId, sale
            ));
        }
        List<SalePayment> payments = paymentRepository.findBySale_IdOrderById(saleId);
        payments.stream().filter(payment -> payment.getMethod() == PaymentMethod.CASH)
                .forEach(payment -> sale.getShift().removeCash(payment.getAmount()));
        sale.cancel(administratorId, request.reason());
        return response(sale, items, payments);
    }

    private void validatePayments(List<SalePaymentRequest> payments, BigDecimal total) {
        BigDecimal paid = BigDecimal.ZERO;
        for (SalePaymentRequest payment : payments) {
            BigDecimal amount = money(payment.amount());
            paid = paid.add(amount);
            if (payment.method() == PaymentMethod.CASH) {
                if (payment.tenderedAmount() == null || money(payment.tenderedAmount()).compareTo(amount) < 0) {
                    throw new InvalidRequestException("El efectivo recibido debe cubrir el importe en efectivo");
                }
            } else if (payment.tenderedAmount() != null) {
                throw new InvalidRequestException("El monto recibido solo se utiliza en pagos en efectivo");
            }
        }
        if (money(paid).compareTo(total) != 0) {
            throw new InvalidRequestException("La suma de los pagos debe coincidir con el total de la venta");
        }
    }

    private SaleResponse response(Sale sale, List<SaleItem> items, List<SalePayment> payments) {
        return SaleResponse.from(
                sale, items.stream().map(SaleItemResponse::from).toList(),
                payments.stream().map(SalePaymentResponse::from).toList()
        );
    }

    private static BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }
    private static BigDecimal percent(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }

    private record CalculatedItem(Product product, SaleItemRequest request, BigDecimal subtotal, BigDecimal total) { }
}
