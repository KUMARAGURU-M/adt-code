package com.arrowdatatech.adt_production_report.role.repository;

import com.arrowdatatech.adt_production_report.role.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    List<UserPermission> findByUserId(UUID userId);

    boolean existsByUserIdAndPermissionId(UUID userId, UUID permissionId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserPermission up WHERE up.user.id = :userId AND up.permission.id = :permissionId")
    void deleteByUserIdAndPermissionId(@Param("userId") UUID userId, @Param("permissionId") UUID permissionId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @Query("DELETE FROM UserPermission up WHERE up.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT p.code FROM UserPermission up
            JOIN up.permission p
            WHERE up.user.id = :userId
            AND up.isDenied = :isDenied
            AND p.isActive = true
            """)
    Set<String> findDirectPermissionCodesByUserIdAndIsDenied(
            @Param("userId") UUID userId,
            @Param("isDenied") boolean isDenied
    );

    @Query("""
            SELECT p.code FROM UserPermission up
            JOIN up.permission p
            WHERE up.user.id = :userId
            AND p.isActive = true
            """)
    Set<String> findDirectPermissionCodesByUserId(@Param("userId") UUID userId);
}
