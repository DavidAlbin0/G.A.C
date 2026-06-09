package com.micSer.xmlends.infrastructure.config;

import com.micSer.xmlends.domain.model.Ejercicio;
import com.micSer.xmlends.domain.repository.EjercicioRepositoryPort;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final EjercicioRepositoryPort repository;

    public DatabaseSeeder(EjercicioRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (repository.findAll().isEmpty()) {
            Ejercicio defaultEj = Ejercicio.builder()
                    .id("60b8d30b9b1d8b2c4c8b4567")
                    .numeroFacturas(15)
                    .montoReembolso(new BigDecimal("5000.00"))
                    .userPropietario("default_user")
                    .userAdmin("admin")
                    .build();
            repository.save(defaultEj);
            System.out.println("Precargado Ejercicio de Reembolso por defecto.");
        }
    }
}
