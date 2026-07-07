package com.arrowdatatech.adt_production_report.job.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.entity.Workflow;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "jobs")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "project_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_jobs_project"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id",
            foreignKey = @ForeignKey(name = "fk_jobs_workflow"))
    private Workflow workflow;

    @Column(name = "job_id_code", nullable = true, length = 60)
    private String jobIdCode;

    @Column(name = "xml_isbn", length = 50)
    private String xmlIsbn;

    @Column(name = "batch", length = 100)
    private String batch;

    @Column(name = "title_name", nullable = false, length = 500)
    private String titleName;

    @Column(name = "page_count", nullable = true)
    private Integer pageCount;

    @Column(name = "number_of_chapters")
    private Integer numberOfChapters;

    @Column(name = "pdf_input_type", length = 50)
    private String pdfInputType;

    @Column(name = "complexity", length = 30)
    private String complexity;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "file_status", length = 30)
    private String fileStatus;

    @Column(name = "upload_date")
    private LocalDate uploadDate;

    @Column(name = "billing_status", length = 30)
    @Builder.Default
    private String billingStatus = "PENDING";

    @Column(name = "receive_date")
    private LocalDate receiveDate;

    @Column(name = "start_month")
    private LocalDate startMonth;

    @Column(name = "end_month")
    private LocalDate endMonth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "import_batch_id",
            foreignKey = @ForeignKey(name = "fk_jobs_import_batch"))
    private ImportBatch importBatch;

    // THE FIX: Tell Hibernate 6 to map this String natively to PostgreSQL JSONB
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "import_metadata", columnDefinition = "jsonb")
    private String importMetadata;

    @Column(name = "process_status", nullable = false, length = 30)
    @Builder.Default
    private String processStatus = "PENDING";

    @Column(name = "qc_status", nullable = false, length = 30)
    @Builder.Default
    private String qcStatus = "PENDING";

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "language", length = 50)
    private String language;

    @Column(name = "employee_names", columnDefinition = "TEXT")
    private String employeeNames;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by",
            foreignKey = @ForeignKey(name = "fk_jobs_created_by"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private User createdBy;
}





