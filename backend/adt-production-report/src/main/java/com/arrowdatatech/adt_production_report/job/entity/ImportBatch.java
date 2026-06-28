package com.arrowdatatech.adt_production_report.job.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "import_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportBatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_import_batch_project"))
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imported_by",
            foreignKey = @ForeignKey(name = "fk_import_batch_imported_by"))
    private User importedBy;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "total_rows", nullable = false)
    @Builder.Default
    private Integer totalRows = 0;

    @Column(name = "successful_rows", nullable = false)
    @Builder.Default
    private Integer successfulRows = 0;

    @Column(name = "failed_rows", nullable = false)
    @Builder.Default
    private Integer failedRows = 0;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "Processing";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "error_details", columnDefinition = "jsonb")
    private String errorDetails;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_mapping_used", columnDefinition = "jsonb")
    private String fieldMappingUsed;

    @Column(name = "is_rolled_back", nullable = false)
    @Builder.Default
    private Boolean isRolledBack = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rolled_back_by",
            foreignKey = @ForeignKey(name = "fk_import_batch_rolled_back_by"))
    private User rolledBackBy;

    @Column(name = "rolled_back_at")
    private OffsetDateTime rolledBackAt;
}