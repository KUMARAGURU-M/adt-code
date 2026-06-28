package com.arrowdatatech.adt_production_report.role.repository;

import com.arrowdatatech.adt_production_report.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    List<Role> findByIsActiveTrueOrderByNameAsc();

    Optional<Role> findByName(String name);

    boolean existsByNameAndIsActiveTrue(String name);

    @Query("""
            SELECT r FROM Role r
            WHERE (:active IS NULL OR r.isActive = :active)
            ORDER BY r.name ASC
            """)
    List<Role> findAllFiltered(
            @org.springframework.data.repository.query.Param("active")
            Boolean active);
}