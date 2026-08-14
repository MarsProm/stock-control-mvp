package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.CascadeType;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sales")
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "register_id", nullable = false)
    private CashRegister register;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shift_id", nullable = false)
    private CashShift shift;

    @Column(name = "cashier_user_id", nullable = false)
    private UUID cashierUserId;

    @Column(name = "sale_number", nullable = false)
    private long saleNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private SaleStatus status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal discountTotal;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal total;

    @OneToOne(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true, optional = false)
    private ReceiptSnapshot receiptSnapshot;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    protected Sale() {
    }

    public Sale(Business business, CashRegister register, CashShift shift, UUID cashierUserId, long saleNumber,
                BigDecimal subtotal, BigDecimal discountTotal, BigDecimal total) {
        this.business = business;
        this.register = register;
        this.shift = shift;
        this.cashierUserId = cashierUserId;
        this.saleNumber = saleNumber;
        this.subtotal = subtotal.setScale(2);
        this.discountTotal = discountTotal.setScale(2);
        this.total = total.setScale(2);
        this.status = SaleStatus.COMPLETED;
        this.receiptSnapshot = new ReceiptSnapshot(this, business);
    }

    public void cancel(UUID administratorId, String reason) {
        status = SaleStatus.CANCELLED;
        cancelledBy = administratorId;
        cancellationReason = reason.trim();
        cancelledAt = Instant.now();
    }

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public UUID getId() { return id; }
    public Business getBusiness() { return business; }
    public CashRegister getRegister() { return register; }
    public CashShift getShift() { return shift; }
    public UUID getCashierUserId() { return cashierUserId; }
    public long getSaleNumber() { return saleNumber; }
    public SaleStatus getStatus() { return status; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getDiscountTotal() { return discountTotal; }
    public BigDecimal getTotal() { return total; }
    public ReceiptSnapshot getReceiptSnapshot() { return receiptSnapshot; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public UUID getCancelledBy() { return cancelledBy; }
    public String getCancellationReason() { return cancellationReason; }
}
