package com.arrowdatatech.adt_production_report.settings.repository;

import com.arrowdatatech.adt_production_report.settings.entity.CompanySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanySettingsRepository
        extends JpaRepository<CompanySettings, UUID> {

    // Always returns the single row
    Optional<CompanySettings> findByIsSingletonTrue();
}