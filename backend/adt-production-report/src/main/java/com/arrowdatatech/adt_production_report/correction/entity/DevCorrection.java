package com.arrowdatatech.adt_production_report.correction.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.task.entity.DevTask;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "dev_corrections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevCorrection extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "task_id", nullable = true, foreignKey = @ForeignKey(name = "fk_dev_corrections_task"))
    private DevTask task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", foreignKey = @ForeignKey(name = "fk_dev_corrections_project"))
    private com.arrowdatatech.adt_production_report.project.entity.DevProject project;

    @Column(name = "correction", nullable = false)
    private String correction;

    @Column(name = "lead_comment", columnDefinition = "TEXT")
    private String leadComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to", foreignKey = @ForeignKey(name = "fk_dev_corrections_assigned_to"))
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", foreignKey = @ForeignKey(name = "fk_dev_corrections_assigned_by"))
    private User assignedBy;

    @Column(name = "assigned_date", nullable = false)
    @Builder.Default
    private LocalDate assignedDate = LocalDate.now();

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "priority", nullable = false, length = 50)
    @Builder.Default
    private String priority = "Medium";

    @Column(name = "developer_reply", columnDefinition = "TEXT")
    private String developerReply;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "Pending Fix";
}
