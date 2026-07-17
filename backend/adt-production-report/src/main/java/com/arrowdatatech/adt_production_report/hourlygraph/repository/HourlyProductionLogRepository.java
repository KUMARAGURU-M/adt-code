package com.arrowdatatech.adt_production_report.hourlygraph.repository;

import com.arrowdatatech.adt_production_report.hourlygraph.entity.HourlyProductionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HourlyProductionLogRepository extends JpaRepository<HourlyProductionLog, UUID> {

    @Query("""
            SELECT h FROM HourlyProductionLog h
            LEFT JOIN FETCH h.user u
            LEFT JOIN FETCH u.employeeProfile ep
            WHERE h.date = :date
            """)
    List<HourlyProductionLog> findByDateWithProfile(LocalDate date);

    Optional<HourlyProductionLog> findByDateAndUserId(LocalDate date, UUID userId);
}