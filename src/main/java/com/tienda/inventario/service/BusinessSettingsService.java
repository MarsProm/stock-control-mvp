package com.tienda.inventario.service;

import com.tienda.inventario.dto.identity.BusinessSettingsRequest;
import com.tienda.inventario.dto.identity.BusinessSettingsResponse;
import com.tienda.inventario.entity.Business;
import com.tienda.inventario.exception.InvalidRequestException;
import com.tienda.inventario.repository.BusinessRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class BusinessSettingsService {
    private static final long MAX_LOGO_SIZE = 2 * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/png", "png", "image/jpeg", "jpg", "image/webp", "webp"
    );

    private final AccessService accessService;
    private final BusinessRepository businessRepository;
    private final SupabaseAdminClient supabaseAdminClient;

    public BusinessSettingsService(AccessService accessService, BusinessRepository businessRepository,
                                   SupabaseAdminClient supabaseAdminClient) {
        this.accessService = accessService;
        this.businessRepository = businessRepository;
        this.supabaseAdminClient = supabaseAdminClient;
    }

    @Transactional(readOnly = true)
    public BusinessSettingsResponse get(UUID businessId) {
        accessService.requireMembership(businessId);
        return BusinessSettingsResponse.from(accessService.requireBusiness(businessId));
    }

    @Transactional
    public BusinessSettingsResponse update(UUID businessId, BusinessSettingsRequest request) {
        accessService.requireAdmin(businessId);
        validateContrast(request.primaryColor());
        validateContrast(request.accentColor());
        Business business = accessService.requireBusiness(businessId);
        business.updateSettings(
                request.name(), request.primaryColor(), request.accentColor(), request.receiptHeader(), request.receiptFooter(),
                request.inventoryEnabled(), request.posEnabled(), request.reportsEnabled()
        );
        return BusinessSettingsResponse.from(business);
    }

    @Transactional
    public BusinessSettingsResponse uploadLogo(UUID businessId, MultipartFile logo) {
        accessService.requireAdmin(businessId);
        if (logo.isEmpty() || logo.getSize() > MAX_LOGO_SIZE) {
            throw new InvalidRequestException("El logo debe pesar como maximo 2 MB");
        }
        String contentType = logo.getContentType();
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new InvalidRequestException("El logo debe ser PNG, JPEG o WebP");
        }
        try {
            Business business = accessService.requireBusiness(businessId);
            business.setLogoUrl(supabaseAdminClient.uploadLogo(businessId, extension, contentType, logo.getBytes()));
            return BusinessSettingsResponse.from(business);
        } catch (IOException exception) {
            throw new InvalidRequestException("No se pudo leer el archivo del logo");
        }
    }

    private void validateContrast(String color) {
        double luminance = luminance(color);
        double whiteContrast = 1.05 / (luminance + 0.05);
        if (whiteContrast < 4.5) {
            throw new InvalidRequestException("El color debe permitir texto con contraste WCAG AA");
        }
    }

    private double luminance(String color) {
        double red = channel(Integer.parseInt(color.substring(1, 3), 16) / 255.0);
        double green = channel(Integer.parseInt(color.substring(3, 5), 16) / 255.0);
        double blue = channel(Integer.parseInt(color.substring(5, 7), 16) / 255.0);
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }

    private double channel(double value) {
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    }
}
