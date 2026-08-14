package com.tienda.inventario.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class CurrentUserService {

    private final boolean securityEnabled;

    public CurrentUserService(@Value("${app.security.enabled}") boolean securityEnabled) {
        this.securityEnabled = securityEnabled;
    }

    public CurrentUser require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return new CurrentUser(UUID.fromString(jwt.getSubject()), jwt.getClaimAsString("email"));
        }
        if (!securityEnabled) {
            UUID userId = UUID.nameUUIDFromBytes("local-development-user".getBytes(StandardCharsets.UTF_8));
            return new CurrentUser(userId, "local@stock-control.test");
        }
        throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Autenticacion requerida");
    }
}
