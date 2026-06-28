package com.arrowdatatech.adt_production_report.role.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // e.g. "employees.create" — resource.action format
    @Column(name = "code", nullable = false, length = 100)
    private String code;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // resource = "employees", "projects", "jobs" etc.
    @Column(name = "resource", nullable = false, length = 50)
    private String resource;

    // action = "create", "update", "delete" etc.
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}