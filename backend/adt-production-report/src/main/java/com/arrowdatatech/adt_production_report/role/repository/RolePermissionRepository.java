package com.arrowdatatech.adt_production_report.role.repository;

import com.arrowdatatech.adt_production_report.role.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository
        extends JpaRepository<RolePermission, UUID> {

    List<RolePermission> findByRoleId(UUID roleId);

    // Get all permission IDs for a role
    @Query("SELECT rp.permission.id FROM RolePermission rp " +
            "WHERE rp.role.id = :roleId")
    List<UUID> findPermissionIdsByRoleId(@Param("roleId") UUID roleId);

    // Delete all permissions for a role (before re-assigning)
    @Modifying
    @Transactional
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId")
    void deleteByRoleId(@Param("roleId") UUID roleId);

    // Delete one specific role-permission pair
    @Modifying
    @Transactional
    @Query("""
            DELETE FROM RolePermission rp
            WHERE rp.role.id = :roleId
            AND rp.permission.id = :permissionId
            """)
    void deleteByRoleIdAndPermissionId(
            @Param("roleId")       UUID roleId,
            @Param("permissionId") UUID permissionId
    );
}