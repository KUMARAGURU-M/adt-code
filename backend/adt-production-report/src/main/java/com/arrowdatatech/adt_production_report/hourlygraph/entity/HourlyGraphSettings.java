package com.arrowdatatech.adt_production_report.hourlygraph.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "hourly_graph_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HourlyGraphSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "column_groups", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String columnGroups = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_rows", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String targetRows = "[]";

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
