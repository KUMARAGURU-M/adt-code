package com.arrowdatatech.adt_production_report.task.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.process.entity.Process;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task extends BaseEntity {

    // ManyToOne: many tasks -> one project
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "project_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_tasks_project"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private Project project;

    // ManyToOne: many tasks -> one process (production stage)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "process_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_tasks_process"))
    private Process process;

    // Auto-generated if blank: "{project} - {process}"
    @Column(name = "task_title", length = 300)
    private String taskTitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Pending, In Progress, On Hold, Completed, Archived
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "Pending";

    @Column(name = "assigned_date", nullable = false)
    @Builder.Default
    private LocalDate assignedDate = LocalDate.now();

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "assigned_pages")
    private Integer assignedPages;

    // THE FIX: Added the missing totalPages property required by the Service
    @Column(name = "total_pages")
    private Integer totalPages;

    // Simple, Medium, Heavy Complex
    @Column(name = "complexity", length = 30)
    private String complexity;

    // Chapter/Article/Batch label shown in WorkWise
    @Column(name = "chapter_article_batch", length = 200)
    private String chapterArticleBatch;

    @Column(name = "estimate_hours", precision = 6, scale = 2)
    private java.math.BigDecimal estimateHours;

    @Column(name = "server_path", columnDefinition = "TEXT")
    private String serverPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by",
            foreignKey = @ForeignKey(name = "fk_tasks_assigned_by"))
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    private User assignedBy;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    // OneToMany: task -> job assignments (multi-job per task)
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY)
    @Builder.Default
    private Set<TaskJobAssignment> jobAssignments = new HashSet<>();

    // OneToMany: task -> employee assignments
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY)
    @Builder.Default
    private Set<TaskEmployeeAssignment> employeeAssignments = new HashSet<>();
}