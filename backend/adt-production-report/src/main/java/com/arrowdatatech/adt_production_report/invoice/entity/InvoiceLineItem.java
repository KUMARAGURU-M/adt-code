package com.arrowdatatech.adt_production_report.invoice.entity;

import com.arrowdatatech.adt_production_report.job.entity.Job;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.project.entity.Workflow;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "invoice_line_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // ManyToOne: many line items -> one invoice
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invoice_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_line_item_invoice"))
    private Invoice invoice;

    // Display sequence number
    @Column(name = "sno", nullable = false)
    private Integer sno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id",
            foreignKey = @ForeignKey(name = "fk_line_item_project"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id",
            foreignKey = @ForeignKey(name = "fk_line_item_process"))
    private Process process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_id",
            foreignKey = @ForeignKey(name = "fk_line_item_workflow"))
    private Workflow workflow;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id",
            foreignKey = @ForeignKey(name = "fk_line_item_job"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Job job;

    @Column(name = "batch_name", length = 300)
    private String batchName;

    @Column(name = "pages", nullable = false)
    @Builder.Default
    private Integer pages = 0;

    // Snapshot at time of invoicing
    @Column(name = "rate_per_page", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal ratePerPage = BigDecimal.ZERO;

    // pages x rate_per_page
    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "deduction", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal deduction = BigDecimal.ZERO;

    // amount - deduction
    @Column(name = "total", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "uploaded_date")
    private LocalDate uploadedDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "process_names", columnDefinition = "TEXT")
    private String processNames;

    @Column(name = "workflow_names", columnDefinition = "TEXT")
    private String workflowNames;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}
