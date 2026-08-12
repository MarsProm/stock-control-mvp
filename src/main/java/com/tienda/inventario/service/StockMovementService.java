package com.tienda.inventario.service;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.movement.CreateMovementRequest;
import com.tienda.inventario.dto.movement.MovementResponse;
import com.tienda.inventario.entity.Product;
import com.tienda.inventario.entity.StockMovement;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.exception.InvalidRequestException;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.mapper.MovementMapper;
import com.tienda.inventario.repository.ProductRepository;
import com.tienda.inventario.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class StockMovementService {

    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;
    private final MovementMapper movementMapper;

    public StockMovementService(
            ProductRepository productRepository,
            StockMovementRepository movementRepository,
            MovementMapper movementMapper
    ) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
        this.movementMapper = movementMapper;
    }

    @Transactional
    public MovementResponse create(UUID productId, CreateMovementRequest request) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el producto " + productId));
        if (!product.isActive()) {
            throw new BusinessConflictException("El producto esta inactivo y no admite movimientos");
        }

        long balanceAfter;
        try {
            balanceAfter = switch (request.type()) {
                case ENTRY -> product.applyEntry(request.quantity());
                case EXIT -> product.applyExit(request.quantity());
            };
        } catch (IllegalArgumentException exception) {
            throw new BusinessConflictException("Stock insuficiente para completar la salida");
        } catch (ArithmeticException exception) {
            throw new BusinessConflictException("La cantidad supera el limite permitido");
        }

        StockMovement movement = new StockMovement(
                product,
                request.type(),
                request.quantity(),
                request.reason(),
                balanceAfter
        );
        return movementMapper.toResponse(movementRepository.save(movement));
    }

    @Transactional(readOnly = true)
    public PageResponse<MovementResponse> history(
            UUID productId,
            Instant from,
            Instant to,
            int page,
            int size
    ) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("No existe el producto " + productId);
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidRequestException("La fecha inicial no puede ser posterior a la final");
        }
        if (page < 0 || size < 1 || size > 100) {
            throw new InvalidRequestException("Paginacion invalida: page >= 0 y size entre 1 y 100");
        }
        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
        );
        Page<StockMovement> result;
        if (from != null && to != null) {
            result = movementRepository.findByProduct_IdAndCreatedAtBetween(productId, from, to, pageable);
        } else if (from != null) {
            result = movementRepository.findByProduct_IdAndCreatedAtGreaterThanEqual(productId, from, pageable);
        } else if (to != null) {
            result = movementRepository.findByProduct_IdAndCreatedAtLessThanEqual(productId, to, pageable);
        } else {
            result = movementRepository.findByProduct_Id(productId, pageable);
        }
        return PageResponse.from(result.map(movementMapper::toResponse));
    }
}
