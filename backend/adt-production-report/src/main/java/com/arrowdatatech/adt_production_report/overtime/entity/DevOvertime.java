package com.arrowdatatech.adt_production_report.overtime.entity;

import com.arrowdatatech.adt_production_report.common.entity.BaseEntity;
import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "dev_overtime")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevOvertime extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_dev_overtime_user"))
    private User user;

    @Column(name = "overtime_date", nullable = false)
    @Builder.Default
    private LocalDate overtimeDate = LocalDate.now();

    @Column(name = "overtime_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal overtimeHours;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_time", length = 50)
    private String startTime;

    @Column(name = "end_time", length = 50)
    private String endTime;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "Pending";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", foreignKey = @ForeignKey(name = "fk_dev_overtime_approved_by"))
    private User approvedBy;
}
