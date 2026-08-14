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
@Table(name = "business_counters")
public class BusinessCounter {
    @Id
    @Column(name = "business_id")
    private UUID businessId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "business_id")
    private Business business;

    @Column(name = "next_sale_number", nullable = false)
    private long nextSaleNumber;

    protected BusinessCounter() {
    }

    public BusinessCounter(Business business) {
        this.business = business;
        this.businessId = business.getId();
        this.nextSaleNumber = 1;
    }

    public long takeNextSaleNumber() {
        return nextSaleNumber++;
    }
}
