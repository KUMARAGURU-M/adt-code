package com.arrowdatatech.adt_production_report.project.entity;

import com.arrowdatatech.adt_production_report.client.entity.Client;
import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "projects")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // ManyToOne: many projects -> one client
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id",
            foreignKey = @ForeignKey(name = "fk_projects_client"))
    private Client client;

    // Per Page or Hourly
    @Column(name = "type", nullable = false, length = 30)
    @Builder.Default
    private String type = "Per Page";

    // Simple, Medium, Heavy Complex
    @Column(name = "complexity_level", nullable = false, length = 20)
    @Builder.Default
    private String complexityLevel = "Medium";

    @Column(name = "rate_per_page", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal ratePerPage = BigDecimal.ZERO;

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // Soft delete
    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}