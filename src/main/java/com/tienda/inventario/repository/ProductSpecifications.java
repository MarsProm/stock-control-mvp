package com.tienda.inventario.repository;

import com.tienda.inventario.entity.Product;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> matchesQuery(String queryText) {
        return (root, query, builder) -> {
            if (queryText == null || queryText.isBlank()) {
                return builder.conjunction();
            }
            String normalized = queryText.trim().toLowerCase(Locale.ROOT);
            return builder.or(
                    builder.equal(builder.lower(root.get("code")), normalized),
                    builder.like(builder.lower(root.get("name")), "%" + normalized + "%")
            );
        };
    }

    public static Specification<Product> hasActive(Boolean active) {
        return (root, query, builder) -> active == null
                ? builder.conjunction()
                : builder.equal(root.get("active"), active);
    }

    public static Specification<Product> isLowStock(boolean lowStock) {
        return (root, query, builder) -> lowStock
                ? builder.lessThanOrEqualTo(root.<Long>get("currentStock"), root.<Long>get("minimumStock"))
                : builder.conjunction();
    }
}
