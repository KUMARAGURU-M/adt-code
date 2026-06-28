package com.arrowdatatech.adt_production_report.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;

import com.arrowdatatech.adt_production_report.role.entity.UserRoleAssignment;
import com.arrowdatatech.adt_production_report.shift.entity.ShiftUserAssignment;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
// SQLRestriction automatically filters soft-deleted users in all queries
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_code", nullable = false, unique = true, length = 20)
    private String userCode;

    // Partial unique index on DB side (WHERE deleted_at IS NULL)
    @Column(name = "email", length = 150)
    private String email;

    // NEVER returned in API responses - @JsonIgnore on DTO level
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    // Soft delete - @SQLRestriction filters this automatically
    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    // Self-referential FK - which admin created this user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by",
            foreignKey = @ForeignKey(name = "fk_users_created_by"))
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    // DB trigger manages this - not Hibernate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    // OneToOne: User -> EmployeeProfile
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, optional = true)
    private EmployeeProfile employeeProfile;

    // OneToOne: User -> EmployeeSalaryDetails
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, optional = true)
    private EmployeeSalaryDetails salaryDetails;

    // OneToMany: User -> UserRoleAssignments
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY)
    @Builder.Default
    private Set<UserRoleAssignment> roleAssignments = new HashSet<>();

    // OneToMany: User -> ShiftUserAssignments
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ShiftUserAssignment> shiftAssignments = new HashSet<>();
}