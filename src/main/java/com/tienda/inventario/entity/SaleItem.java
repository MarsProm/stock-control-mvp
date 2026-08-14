package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "sale_items")
public class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private long quantity;

    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "discount_reason", length = 255)
    private String discountReason;

    @Column(name = "line_subtotal", nullable = false, precision = 19, scale = 2)
    private BigDecimal lineSubtotal;

    @Column(name = "line_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal lineTotal;

    protected SaleItem() {
    }

    public SaleItem(Sale sale, Product product, long quantity, BigDecimal discountPercent, String discountReason,
                    BigDecimal lineSubtotal, BigDecimal lineTotal) {
        this.sale = sale;
        this.product = product;
        this.productCode = product.getCode();
        this.productName = product.getName();
        this.unitPrice = product.getPrice();
        this.quantity = quantity;
        this.discountPercent = discountPercent;
        this.discountReason = discountReason == null || discountReason.isBlank() ? null : discountReason.trim();
        this.lineSubtotal = lineSubtotal;
        this.lineTotal = lineTotal;
    }

    public UUID getId() { return id; }
    public Sale getSale() { return sale; }
    public Product getProduct() { return product; }
    public String getProductCode() { return productCode; }
    public String getProductName() { return productName; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public long getQuantity() { return quantity; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public String getDiscountReason() { return discountReason; }
    public BigDecimal getLineSubtotal() { return lineSubtotal; }
    public BigDecimal getLineTotal() { return lineTotal; }
}
