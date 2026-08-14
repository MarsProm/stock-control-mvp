package com.tienda.inventario.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtAudienceValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.time.Duration;

@Configuration
public class SecurityConfig {

    @Bean
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Value("${app.security.enabled}") boolean securityEnabled
    ) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.requestCache(cache -> cache.disable());
        http.authorizeHttpRequests(authorize -> {
            authorize.requestMatchers("/", "/actuator/health", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll();
            authorize.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
            if (securityEnabled) {
                authorize.anyRequest().authenticated();
            } else {
                authorize.anyRequest().permitAll();
            }
        });
        if (securityEnabled) {
            http.oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()));
        }
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${app.security.supabase-issuer}") String issuer,
            @Value("${app.security.supabase-jwks-uri}") String jwksUri,
            @Value("${app.security.audience}") String audience
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .restOperations(jwksRestTemplate())
                .cache(new ConcurrentMapCache("supabase-jwks"))
                .build();
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuer);
        OAuth2TokenValidator<Jwt> withAudience = new JwtAudienceValidator(audience);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
        return decoder;
    }

    static RestTemplate jwksRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(8));
        RestTemplate restTemplate = new RestTemplate(requestFactory);
        restTemplate.getInterceptors().add(retryingJwksInterceptor(3));
        return restTemplate;
    }

    static ClientHttpRequestInterceptor retryingJwksInterceptor(int maxAttempts) {
        return (request, body, execution) -> {
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return execution.execute(request, body);
                } catch (IOException failure) {
                    if (attempt == maxAttempts) {
                        throw failure;
                    }
                }
            }
            throw new IllegalStateException("No se pudo consultar el JWKS");
        };
    }
}
