package com.arrowdatatech.adt_production_report.leave.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "leave_policies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LeavePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "default_annual_days", nullable = false)
    @Builder.Default
    private Integer defaultAnnualDays = 12;

    @Column(name = "probation_days", nullable = false)
    @Builder.Default
    private Integer probationDays = 0;

    @Column(name = "year_start_month", nullable = false, length = 20)
    @Builder.Default
    private String yearStartMonth = "January";

    @Column(name = "year_start_day", nullable = false)
    @Builder.Default
    private Short yearStartDay = 1;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}