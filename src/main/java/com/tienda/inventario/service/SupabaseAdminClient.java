package com.tienda.inventario.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;
import java.util.Set;

@Component
public class SupabaseAdminClient {
    private final RestClient restClient;
    private final String secretKey;
    private final String redirectUrl;
    private final String baseUrl;
    private final String brandingBucket;
    private final boolean securityEnabled;

    public SupabaseAdminClient(
            RestClient.Builder builder,
            @Value("${app.supabase.url}") String url,
            @Value("${app.supabase.secret-key}") String secretKey,
            @Value("${app.supabase.invite-redirect-url}") String redirectUrl,
            @Value("${app.supabase.branding-bucket}") String brandingBucket,
            @Value("${app.security.enabled}") boolean securityEnabled
    ) {
        this.baseUrl = url;
        this.restClient = url.isBlank() ? null : builder.baseUrl(url).build();
        this.secretKey = secretKey;
        this.redirectUrl = redirectUrl;
        this.brandingBucket = brandingBucket;
        this.securityEnabled = securityEnabled;
    }

    public void invite(String email) {
        if (restClient == null || secretKey.isBlank()) {
            if (securityEnabled) {
                throw new com.tienda.inventario.exception.BusinessConflictException("Supabase Auth no esta configurado");
            }
            return;
        }
        try {
            restClient.post()
                    .uri(uriBuilder -> uriBuilder.path("/auth/v1/invite").queryParam("redirect_to", redirectUrl).build())
                    .header("apikey", secretKey)
                    .body(Map.of("email", email))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            if (!isExistingUser(exception)) {
                throw exception;
            }
        }
    }

    public String uploadLogo(java.util.UUID businessId, String extension, String contentType, byte[] content) {
        if (restClient == null || secretKey.isBlank()) {
            throw new com.tienda.inventario.exception.BusinessConflictException("Supabase Storage no esta configurado");
        }
        String objectPath = businessId + "/logo-" + System.currentTimeMillis() + "." + extension;
        restClient.post()
                .uri("/storage/v1/object/" + brandingBucket + "/" + objectPath)
                .header("apikey", secretKey)
                .header("Content-Type", contentType)
                .body(content)
                .retrieve()
                .toBodilessEntity();
        return baseUrl + "/storage/v1/object/public/" + brandingBucket + "/" + objectPath;
    }

    private boolean isExistingUser(RestClientResponseException exception) {
        try {
            SupabaseAuthError error = exception.getResponseBodyAs(SupabaseAuthError.class);
            return error != null && Set.of("email_exists", "user_already_exists").contains(error.code());
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    private record SupabaseAuthError(String code) {
    }
}
