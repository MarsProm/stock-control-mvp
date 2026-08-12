package com.tienda.inventario.controller;

import com.tienda.inventario.dto.product.ProductResponse;
import com.tienda.inventario.exception.GlobalExceptionHandler;
import com.tienda.inventario.exception.ResourceNotFoundException;
import com.tienda.inventario.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @Test
    void createsProductAndReturnsLocation() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.create(any())).thenReturn(new ProductResponse(
                id, "CAF-001", "Cafe", null, new BigDecimal("8500.00"),
                0, 5, true, true, Instant.now(), Instant.now()
        ));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"CAF-001","name":"Cafe","price":8500.00,"minimumStock":5}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/products/" + id))
                .andExpect(jsonPath("$.code").value("CAF-001"))
                .andExpect(jsonPath("$.currentStock").value(0));
    }

    @Test
    void returnsValidationProblem() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"X","name":"","price":-1,"minimumStock":-2}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Error de validacion"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void rejectsNegativeInitialStock() throws Exception {
        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"7791234567890","name":"Cafe","price":8500.00,"minimumStock":5,"initialStock":-1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Error de validacion"))
                .andExpect(jsonPath("$.errors[0].pointer").value("/initialStock"));
    }

    @Test
    void findsInactiveProductByExactCode() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.getByCode("7791234567890")).thenReturn(new ProductResponse(
                id, "7791234567890", "Cafe", null, new BigDecimal("8500.00"),
                4, 5, true, false, Instant.now(), Instant.now()
        ));

        mockMvc.perform(get("/api/v1/products/by-code").param("code", "7791234567890"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("7791234567890"))
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void returnsNotFoundForUnknownCode() throws Exception {
        when(productService.getByCode("7790000000000"))
                .thenThrow(new ResourceNotFoundException("No existe el producto con codigo 7790000000000"));

        mockMvc.perform(get("/api/v1/products/by-code").param("code", "7790000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Recurso no encontrado"));
    }
}
