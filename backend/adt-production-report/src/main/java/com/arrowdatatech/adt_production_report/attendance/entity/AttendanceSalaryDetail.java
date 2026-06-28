package com.arrowdatatech.adt_production_report.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_salary_details",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_salary_detail",
                columnNames = {"employee_id", "year", "month"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceSalaryDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_att_sal_employee"))
    private AttendanceEmployee employee;

    // 2024, 2025, 2026...
    @Column(name = "year", nullable = false)
    private Short year;

    // 0=Jan ... 11=Dec (matches JS Date.getMonth())
    @Column(name = "month", nullable = false)
    private Short month;

    // NULL = use employee.baseSalary; set to override this month
    @Column(name = "base_salary", precision = 10, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "incentive", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal incentive = BigDecimal.ZERO;

    @Column(name = "advance", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal advance = BigDecimal.ZERO;

    // credited | pending | wip
    @Column(name = "salary_status", nullable = false, length = 20)
    @Builder.Default
    private String salaryStatus = "pending";

    @Column(name = "is_hidden", nullable = false)
    @Builder.Default
    private Boolean isHidden = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}