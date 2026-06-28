package com.arrowdatatech.adt_production_report.user.repository;

import com.arrowdatatech.adt_production_report.user.entity.EmployeeSalaryDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeSalaryRepository
        extends JpaRepository<EmployeeSalaryDetails, UUID> {

    Optional<EmployeeSalaryDetails> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}