package com.tienda.inventario.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SupabaseAdminClientTest {

    @Test
    void sendsSecretKeyOnlyAsApiKeyWhenInvitingAUser() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SupabaseAdminClient client = createClient(builder);

        server.expect(request -> {
                    assertEquals("/auth/v1/invite", request.getURI().getPath());
                    assertTrue(request.getURI().getRawQuery().contains("redirect_to="));
                    assertEquals("sb_secret_test", request.getHeaders().getFirst("apikey"));
                    assertNull(request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
                })
                .andRespond(withSuccess());

        client.invite("admin@tienda.test");

        server.verify();
    }

    @Test
    void keepsTheLocalInvitationWhenTheAuthUserAlreadyExists() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SupabaseAdminClient client = createClient(builder);

        server.expect(request -> assertEquals("/auth/v1/invite", request.getURI().getPath()))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"code\":\"user_already_exists\",\"message\":\"User already registered\"}"));

        client.invite("admin@tienda.test");

        server.verify();
    }

    @Test
    void propagatesOtherSupabaseAuthErrors() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SupabaseAdminClient client = createClient(builder);

        server.expect(request -> assertEquals("/auth/v1/invite", request.getURI().getPath()))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"code\":\"over_email_send_rate_limit\"}"));

        assertThrows(RestClientResponseException.class, () -> client.invite("admin@tienda.test"));
        server.verify();
    }

    @Test
    void sendsSecretKeyOnlyAsApiKeyWhenUploadingALogo() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        SupabaseAdminClient client = createClient(builder);

        server.expect(request -> {
                    assertTrue(request.getURI().getPath().startsWith("/storage/v1/object/business-branding/"));
                    assertEquals("sb_secret_test", request.getHeaders().getFirst("apikey"));
                    assertNull(request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
                    assertEquals("image/png", request.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE));
                })
                .andRespond(withSuccess());

        client.uploadLogo(java.util.UUID.randomUUID(), "png", "image/png", new byte[]{1, 2, 3});

        server.verify();
    }

    private SupabaseAdminClient createClient(RestClient.Builder builder) {
        return new SupabaseAdminClient(
                builder,
                "https://project.supabase.co",
                "sb_secret_test",
                "https://stock-control-mvp.vercel.app/accept-invitation",
                "business-branding",
                true
        );
    }
}
