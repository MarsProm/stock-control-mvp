package com.tienda.inventario.controller;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.exception.GlobalExceptionHandler;
import com.tienda.inventario.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
class ProductSearchTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @Test
    void delegatesSearchAndReturnsStablePageShape() throws Exception {
        when(productService.search("cafe", true, true, 0, 20, "name,asc"))
                .thenReturn(new PageResponse<>(List.of(), new PageResponse.PageMetadata(0, 20, 0, 0)));

        mockMvc.perform(get("/api/v1/products")
                        .param("query", "cafe")
                        .param("lowStock", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$.page.totalElements").value(0));
    }
}
