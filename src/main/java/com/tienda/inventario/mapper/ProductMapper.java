package com.tienda.inventario.mapper;

import com.tienda.inventario.dto.product.ProductResponse;
import com.tienda.inventario.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getCode(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getCurrentStock(),
                product.getMinimumStock(),
                product.isLowStock(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
