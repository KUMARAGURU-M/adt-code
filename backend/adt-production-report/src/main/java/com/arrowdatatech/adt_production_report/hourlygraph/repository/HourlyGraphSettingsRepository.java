package com.arrowdatatech.adt_production_report.hourlygraph.repository;

import com.arrowdatatech.adt_production_report.hourlygraph.entity.HourlyGraphSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HourlyGraphSettingsRepository extends JpaRepository<HourlyGraphSettings, UUID> {
}
