package com.arrowdatatech.adt_production_report.user.repository;

import com.arrowdatatech.adt_production_report.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByUserCodeAndDeletedAtIsNull(String userCode);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    boolean existsByUserCode(String userCode);

    List<User> findByIsActiveTrueAndDeletedAtIsNull();

    @Query("""
            SELECT u FROM User u
            JOIN u.employeeProfile ep
            WHERE u.deletedAt IS NULL
            AND (:search IS NULL
                OR LOWER(ep.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(u.userCode) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY ep.fullName ASC
            """)
    Page<User> searchUsers(String search, Pageable pageable);

    @Modifying
    @Transactional
    @Query("""
            UPDATE User u
            SET u.deletedAt = :now,
                u.isActive = false,
                u.updatedAt = :now
            WHERE u.id = :userId
            """)
    void softDeleteById(UUID userId, OffsetDateTime now);

    @Modifying
    @Transactional
    @Query("""
            UPDATE User u
            SET u.lastLoginAt = :now,
                u.updatedAt = :now
            WHERE u.id = :userId
            """)
    void updateLastLogin(UUID userId, OffsetDateTime now);

    @Query("""
            SELECT u FROM User u
            JOIN u.employeeProfile ep
            WHERE u.isActive = true
            AND u.deletedAt IS NULL
            AND EXISTS (
                SELECT 1 FROM UserRoleAssignment ura
                JOIN ura.role r
                WHERE ura.user = u
                AND r.name IN ('Admin', 'Manager', 'Team Leader')
            )
            ORDER BY ep.fullName ASC
            """)
    List<User> findApprovers();

    @Query("""
            SELECT u FROM User u
            JOIN u.roleAssignments ura
            JOIN ura.role r
            JOIN u.employeeProfile ep
            WHERE r.name = :roleName
            AND u.isActive = true
            AND u.deletedAt IS NULL
            ORDER BY ep.fullName ASC
            """)
    List<User> findByRoleName(String roleName);

    @Query("""
            SELECT u FROM User u
            JOIN u.employeeProfile ep
            WHERE ep.isTopPerformer = true
            AND u.isActive = true
            AND u.deletedAt IS NULL
            """)
    List<User> findTopPerformers();

    @Query("""
            SELECT u FROM User u
            LEFT JOIN FETCH u.employeeProfile ep
            LEFT JOIN FETCH u.roleAssignments ura
            LEFT JOIN FETCH ura.role r
            WHERE u.id = :userId
            AND u.deletedAt IS NULL
            """)
    Optional<User> findByIdWithProfile(UUID userId);

    @Query("SELECT COUNT(u) FROM User u WHERE u.deletedAt IS NULL")
    long countTotalUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true AND u.deletedAt IS NULL")
    long countActiveUsers();
}