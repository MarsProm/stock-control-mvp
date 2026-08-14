package com.tienda.inventario.repository;

import com.tienda.inventario.entity.PlatformAdministrator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlatformAdministratorRepository extends JpaRepository<PlatformAdministrator, UUID> {
}
