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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cash_shifts")
public class CashShift {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "register_id", nullable = false)
    private CashRegister register;

    @Column(name = "cashier_user_id", nullable = false)
    private UUID cashierUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ShiftStatus status;

    @Column(name = "opening_cash", nullable = false, precision = 19, scale = 2)
    private BigDecimal openingCash;

    @Column(name = "expected_cash", nullable = false, precision = 19, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "counted_cash", precision = 19, scale = 2)
    private BigDecimal countedCash;

    @Column(precision = 19, scale = 2)
    private BigDecimal difference;

    @Column(name = "opened_at", nullable = false, updatable = false)
    private Instant openedAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    protected CashShift() {
    }

    public CashShift(Business business, CashRegister register, UUID cashierUserId, BigDecimal openingCash) {
        this.business = business;
        this.register = register;
        this.cashierUserId = cashierUserId;
        this.openingCash = money(openingCash);
        this.expectedCash = this.openingCash;
        this.status = ShiftStatus.OPEN;
    }

    public void addCash(BigDecimal amount) {
        expectedCash = expectedCash.add(money(amount));
    }

    public void removeCash(BigDecimal amount) {
        expectedCash = expectedCash.subtract(money(amount));
    }

    public void close(BigDecimal countedCash) {
        this.countedCash = money(countedCash);
        this.difference = this.countedCash.subtract(expectedCash);
        this.status = ShiftStatus.CLOSED;
        this.closedAt = Instant.now();
    }

    @PrePersist
    void onCreate() { openedAt = Instant.now(); }

    private static BigDecimal money(BigDecimal value) { return value.setScale(2, RoundingMode.HALF_UP); }

    public UUID getId() { return id; }
    public Business getBusiness() { return business; }
    public CashRegister getRegister() { return register; }
    public UUID getCashierUserId() { return cashierUserId; }
    public ShiftStatus getStatus() { return status; }
    public BigDecimal getOpeningCash() { return openingCash; }
    public BigDecimal getExpectedCash() { return expectedCash; }
    public BigDecimal getCountedCash() { return countedCash; }
    public BigDecimal getDifference() { return difference; }
    public Instant getOpenedAt() { return openedAt; }
    public Instant getClosedAt() { return closedAt; }
}
