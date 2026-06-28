package com.arrowdatatech.adt_production_report.role.repository;

import com.arrowdatatech.adt_production_report.role.entity.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleAssignmentRepository
        extends JpaRepository<UserRoleAssignment, UUID> {

    List<UserRoleAssignment> findByUserId(UUID userId);

    boolean existsByUserIdAndRoleId(UUID userId, UUID roleId);

    @Query("""
            SELECT r.name FROM UserRoleAssignment ura
            JOIN ura.role r
            WHERE ura.user.id = :userId
            AND r.isActive = true
            """)
    List<String> findRoleNamesByUserId(@Param("userId") UUID userId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM UserRoleAssignment ura
            WHERE ura.user.id = :userId
            AND ura.role.id = :roleId
            """)
    void deleteByUserIdAndRoleId(
            @Param("userId") UUID userId,
            @Param("roleId") UUID roleId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserRoleAssignment ura WHERE ura.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}