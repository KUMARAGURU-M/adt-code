package com.arrowdatatech.adt_production_report.role.repository;

import com.arrowdatatech.adt_production_report.role.entity.Permission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {

    List<Permission> findByIsActiveTrueOrderByCodeAsc();

    @Query("""
            SELECT p FROM Permission p
            WHERE p.isActive = true
            AND (:resource IS NULL OR p.resource = :resource)
            ORDER BY p.resource ASC, p.action ASC
            """)
    Page<Permission> findByResource(
            @Param("resource") String resource,
            Pageable pageable
    );

    List<Permission> findByResourceAndIsActiveTrue(String resource);

    Optional<Permission> findByCode(String code);

    List<Permission> findByResource(String resource);

    List<Permission> findByIsActiveTrue();

    boolean existsByCode(String code);

    @Query("""
            SELECT DISTINCT p.code FROM UserRoleAssignment ura
            JOIN ura.role r
            JOIN r.rolePermissions rp
            JOIN rp.permission p
            WHERE ura.user.id = :userId
            AND p.isActive = true
            AND r.isActive = true
            """)
    Set<String> findPermissionCodesByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT p FROM Permission p
            WHERE p.isActive = true
            ORDER BY p.resource, p.action
            """)
    List<Permission> findAllActiveOrderedByResource();

}