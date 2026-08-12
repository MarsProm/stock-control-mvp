package com.tienda.inventario.controller;

import com.tienda.inventario.dto.common.PageResponse;
import com.tienda.inventario.exception.GlobalExceptionHandler;
import com.tienda.inventario.service.StockMovementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StockMovementController.class)
@Import(GlobalExceptionHandler.class)
class MovementHistoryTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockMovementService movementService;

    @Test
    void returnsEmptyHistoryWithStablePageShape() throws Exception {
        UUID productId = UUID.randomUUID();
        when(movementService.history(productId, null, null, 0, 20))
                .thenReturn(new PageResponse<>(List.of(), new PageResponse.PageMetadata(0, 20, 0, 0)));

        mockMvc.perform(get("/api/v1/products/{id}/movements", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.page.totalElements").value(0));
    }
}
