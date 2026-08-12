package com.tienda.inventario.service;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.dto.product.CreateProductRequest;
import com.tienda.inventario.dto.product.ProductResponse;
import com.tienda.inventario.dto.product.UpdateProductRequest;
import com.tienda.inventario.entity.MovementType;
import com.tienda.inventario.entity.Product;
import com.tienda.inventario.entity.StockMovement;
import com.tienda.inventario.exception.BusinessConflictException;
import com.tienda.inventario.exception.InvalidRequestException;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.mapper.ProductMapper;
import com.tienda.inventario.repository.ProductRepository;
import com.tienda.inventario.repository.ProductSpecifications;
import com.tienda.inventario.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductService {

    private static final Set<String> ALLOWED_SORTS = Set.of("name", "code", "updatedAt");
    private final ProductRepository productRepository;
    private final StockMovementRepository movementRepository;
    private final ProductMapper productMapper;

    public ProductService(
            ProductRepository productRepository,
            StockMovementRepository movementRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.movementRepository = movementRepository;
        this.productMapper = productMapper;
    }

    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        String code = normalizeCode(request.code());
        if (productRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessConflictException("Ya existe un producto con el codigo " + code);
        }
        Product product = new Product(
                code,
                request.name(),
                request.description(),
                request.price(),
                request.minimumStock()
        );
        long initialStock = request.initialStock() == null ? 0 : request.initialStock();
        if (initialStock > 0) {
            product.applyEntry(initialStock);
        }

        Product savedProduct = productRepository.save(product);
        if (initialStock > 0) {
            movementRepository.save(new StockMovement(
                    savedProduct,
                    MovementType.ENTRY,
                    initialStock,
                    "Inventario inicial",
                    savedProduct.getCurrentStock()
            ));
        }
        return productMapper.toResponse(savedProduct);
    }

    @Transactional(readOnly = true)
    public ProductResponse get(UUID id) {
        return productMapper.toResponse(findProduct(id));
    }

    @Transactional(readOnly = true)
    public ProductResponse getByCode(String rawCode) {
        String code = normalizeCode(rawCode);
        if (code.length() < 3 || code.length() > 50) {
            throw new InvalidRequestException("El codigo debe tener entre 3 y 50 caracteres");
        }
        Product product = productRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el producto con codigo " + code));
        return productMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(
            String queryText,
            Boolean active,
            boolean lowStock,
            int page,
            int size,
            String sort
    ) {
        PageRequest pageRequest = pageRequest(page, size, sort);
        Specification<Product> specification = Specification.allOf(
                ProductSpecifications.matchesQuery(queryText),
                ProductSpecifications.hasActive(active),
                ProductSpecifications.isLowStock(lowStock)
        );
        Page<ProductResponse> result = productRepository.findAll(specification, pageRequest)
                .map(productMapper::toResponse);
        return PageResponse.from(result);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request) {
        Product product = findProduct(id);
        String code = normalizeCode(request.code());
        if (productRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new BusinessConflictException("Ya existe otro producto con el codigo " + code);
        }
        product.updateDetails(code, request.name(), request.description(), request.price(), request.minimumStock());
        return productMapper.toResponse(productRepository.saveAndFlush(product));
    }

    @Transactional
    public ProductResponse deactivate(UUID id) {
        Product product = findProduct(id);
        product.deactivate();
        return productMapper.toResponse(productRepository.saveAndFlush(product));
    }

    private Product findProduct(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el producto " + id));
    }

    private PageRequest pageRequest(int page, int size, String sortValue) {
        if (page < 0) {
            throw new InvalidRequestException("La pagina no puede ser negativa");
        }
        if (size < 1 || size > 100) {
            throw new InvalidRequestException("El tamano de pagina debe estar entre 1 y 100");
        }
        String[] parts = (sortValue == null || sortValue.isBlank() ? "name,asc" : sortValue).split(",");
        if (parts.length != 2 || !ALLOWED_SORTS.contains(parts[0])) {
            throw new InvalidRequestException("Orden permitido: name, code o updatedAt con asc o desc");
        }
        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(parts[1]);
        } catch (IllegalArgumentException exception) {
            throw new InvalidRequestException("La direccion de orden debe ser asc o desc");
        }
        return PageRequest.of(page, size, Sort.by(direction, parts[0]));
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new InvalidRequestException("El codigo es obligatorio");
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }
}
