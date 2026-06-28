package com.arrowdatatech.adt_production_report.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // repair updates the schema history table checksums to match the classpath migration files
            flyway.repair();
            // migrate applies any new migrations
            flyway.migrate();
        };
    }
}
