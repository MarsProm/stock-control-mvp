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
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "sale_payments")
public class SalePayment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private PaymentMethod method;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "tendered_amount", precision = 19, scale = 2)
    private BigDecimal tenderedAmount;

    @Column(name = "change_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal changeAmount;

    @Column(length = 120)
    private String reference;

    protected SalePayment() {
    }

    public SalePayment(Sale sale, PaymentMethod method, BigDecimal amount, BigDecimal tenderedAmount,
                       BigDecimal changeAmount, String reference) {
        this.sale = sale;
        this.method = method;
        this.amount = amount;
        this.tenderedAmount = tenderedAmount;
        this.changeAmount = changeAmount;
        this.reference = reference == null || reference.isBlank() ? null : reference.trim();
    }

    public UUID getId() { return id; }
    public PaymentMethod getMethod() { return method; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getTenderedAmount() { return tenderedAmount; }
    public BigDecimal getChangeAmount() { return changeAmount; }
    public String getReference() { return reference; }
}
