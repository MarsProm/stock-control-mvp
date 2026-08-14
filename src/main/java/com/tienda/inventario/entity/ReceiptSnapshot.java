package com.tienda.inventario.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "receipt_snapshots")
public class ReceiptSnapshot {
    @Id
    @Column(name = "sale_id")
    private UUID saleId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @Column(name = "logo_url", length = 600)
    private String logoUrl;

    @Column(name = "primary_color", nullable = false, length = 7)
    private String primaryColor;

    @Column(name = "accent_color", nullable = false, length = 7)
    private String accentColor;

    @Column(name = "receipt_header", length = 250)
    private String receiptHeader;

    @Column(name = "receipt_footer", length = 250)
    private String receiptFooter;

    protected ReceiptSnapshot() {
    }

    public ReceiptSnapshot(Sale sale, Business business) {
        this.sale = sale;
        this.businessName = business.getName();
        this.logoUrl = business.getLogoUrl();
        this.primaryColor = business.getPrimaryColor();
        this.accentColor = business.getAccentColor();
        this.receiptHeader = business.getReceiptHeader();
        this.receiptFooter = business.getReceiptFooter();
    }

    public String getBusinessName() { return businessName; }
    public String getLogoUrl() { return logoUrl; }
    public String getPrimaryColor() { return primaryColor; }
    public String getAccentColor() { return accentColor; }
    public String getReceiptHeader() { return receiptHeader; }
    public String getReceiptFooter() { return receiptFooter; }
}
