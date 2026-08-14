package com.tienda.inventario.repository;

import com.tienda.inventario.entity.PaymentMethod;
import com.tienda.inventario.entity.SalePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface SalePaymentRepository extends JpaRepository<SalePayment, UUID> {
    List<SalePayment> findBySale_IdOrderById(UUID saleId);

    @Query("select coalesce(sum(payment.amount), 0) from SalePayment payment where payment.sale.shift.id = :shiftId and payment.method = :method and payment.sale.status = 'COMPLETED'")
    BigDecimal sumCompletedByShiftAndMethod(@Param("shiftId") UUID shiftId, @Param("method") PaymentMethod method);
}
