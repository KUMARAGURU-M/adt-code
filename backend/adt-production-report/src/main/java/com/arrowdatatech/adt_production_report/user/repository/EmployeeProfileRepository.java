package com.arrowdatatech.adt_production_report.user.repository;

import com.arrowdatatech.adt_production_report.user.entity.EmployeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, UUID> {

    Optional<EmployeeProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);

    // For attendance summary page - name + role display
    @Query("""
            SELECT ep FROM EmployeeProfile ep
            JOIN FETCH ep.user u
            WHERE u.isActive = true
            AND u.deletedAt IS NULL
            ORDER BY ep.fullName ASC
            """)
    List<EmployeeProfile> findAllActiveEmployeeProfiles();
}