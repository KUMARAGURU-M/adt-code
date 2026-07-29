package com.arrowdatatech.adt_production_report.jobopening.repository;

import com.arrowdatatech.adt_production_report.jobopening.entity.JobOpening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobOpeningRepository extends JpaRepository<JobOpening, UUID> {
    List<JobOpening> findByActiveTrueOrderByCreatedAtDesc();
    List<JobOpening> findAllByOrderByCreatedAtDesc();
}
