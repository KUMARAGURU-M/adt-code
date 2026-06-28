package com.arrowdatatech.adt_production_report.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Base entity providing common audit fields.
 * updated_at is managed by DB triggers (V41 migration).
 * created_at is set once by Hibernate @CreationTimestamp.
 */
@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @CreationTimestamp  // sets on insert; DB trigger overwrites on update
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}