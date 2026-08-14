package com.tienda.inventario.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpResponse;

import java.net.SocketTimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {

    @Test
    void retriesTemporaryJwksTimeouts() throws Exception {
        AtomicInteger attempts = new AtomicInteger();
        HttpRequest request = mock(HttpRequest.class);
        ClientHttpResponse expected = mock(ClientHttpResponse.class);
        ClientHttpRequestExecution execution = (ignoredRequest, ignoredBody) -> {
            if (attempts.incrementAndGet() < 3) {
                throw new SocketTimeoutException("Read timed out");
            }
            return expected;
        };

        ClientHttpResponse response = SecurityConfig.retryingJwksInterceptor(3)
                .intercept(request, new byte[0], execution);

        assertSame(expected, response);
        assertEquals(3, attempts.get());
    }

    @Test
    void stopsAfterConfiguredJwksAttempts() {
        AtomicInteger attempts = new AtomicInteger();
        HttpRequest request = mock(HttpRequest.class);
        ClientHttpRequestExecution execution = (ignoredRequest, ignoredBody) -> {
            attempts.incrementAndGet();
            throw new SocketTimeoutException("Read timed out");
        };

        assertThrows(SocketTimeoutException.class, () -> SecurityConfig.retryingJwksInterceptor(3)
                .intercept(request, new byte[0], execution));
        assertEquals(3, attempts.get());
    }
}
