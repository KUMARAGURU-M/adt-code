package com.arrowdatatech.adt_production_report.job.entity;

import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "import_field_mappings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportFieldMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // OneToOne: one JSONB mapping per project
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_ifm_project"))
    private Project project;

    // Stored as JSONB string: ["receiveDate","jobId","title","pageCount"]
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_order", nullable = false,
            columnDefinition = "jsonb")
    @Builder.Default
    private String fieldOrder = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "required_fields", columnDefinition = "jsonb")
    private String requiredFields;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by",
            foreignKey = @ForeignKey(name = "fk_ifm_created_by"))
    private User createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}