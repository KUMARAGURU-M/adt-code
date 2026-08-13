package com.arrowdatatech.adt_production_report.project_target.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "project_targets", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "year", "month"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTarget extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false)
    private Integer month;

    @Column(name = "monthly_target_books", nullable = false)
    @Builder.Default
    private Integer monthlyTargetBooks = 0;

    @Column(name = "weekly_target_books", nullable = false)
    @Builder.Default
    private Integer weeklyTargetBooks = 0;

    @Column(name = "week1_target_books", nullable = false)
    @Builder.Default
    private Integer week1TargetBooks = 0;

    @Column(name = "week2_target_books", nullable = false)
    @Builder.Default
    private Integer week2TargetBooks = 0;

    @Column(name = "week3_target_books", nullable = false)
    @Builder.Default
    private Integer week3TargetBooks = 0;

    @Column(name = "week4_target_books", nullable = false)
    @Builder.Default
    private Integer week4TargetBooks = 0;

    @Column(name = "week5_target_books", nullable = false)
    @Builder.Default
    private Integer week5TargetBooks = 0;

    @Column(name = "billing_cycle_start_date")
    private java.time.LocalDate billingCycleStartDate;

    @Column(name = "billing_cycle_end_date")
    private java.time.LocalDate billingCycleEndDate;

    @Column(name = "target_pages_simple")
    @Builder.Default
    private Integer targetPagesSimple = 0;

    @Column(name = "target_pages_medium")
    @Builder.Default
    private Integer targetPagesMedium = 0;

    @Column(name = "target_pages_complex")
    @Builder.Default
    private Integer targetPagesComplex = 0;

    @Column(name = "target_pages_heavy_complex")
    @Builder.Default
    private Integer targetPagesHeavyComplex = 0;

    @Column(name = "target_pages_total")
    @Builder.Default
    private Integer targetPagesTotal = 0;

    @Column(name = "target_pages_week1")
    @Builder.Default
    private Integer targetPagesWeek1 = 0;

    @Column(name = "target_pages_week2")
    @Builder.Default
    private Integer targetPagesWeek2 = 0;

    @Column(name = "target_pages_week3")
    @Builder.Default
    private Integer targetPagesWeek3 = 0;

    @Column(name = "target_pages_week4")
    @Builder.Default
    private Integer targetPagesWeek4 = 0;
}
