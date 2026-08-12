package com.tienda.inventario.dto.common;

import org.springframework.data.domain.Page;

import java.util.List;

public record PageResponse<T>(List<T> content, PageMetadata page) {

    public static <T> PageResponse<T> from(Page<T> source) {
        return new PageResponse<>(
                source.getContent(),
                new PageMetadata(
                        source.getNumber(),
                        source.getSize(),
                        source.getTotalElements(),
                        source.getTotalPages()
                )
        );
    }

    public record PageMetadata(int number, int size, long totalElements, int totalPages) {
    }
}
