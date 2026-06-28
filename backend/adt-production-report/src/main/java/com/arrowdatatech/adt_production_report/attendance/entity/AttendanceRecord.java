package com.arrowdatatech.adt_production_report.attendance.entity;

import com.arrowdatatech.adt_production_report.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_att_record",
                columnNames = {"employee_id", "attendance_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_att_rec_employee"))
    private AttendanceEmployee employee;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    // P | A | H | PH | WO | "" (not yet marked)
    @Column(name = "status", nullable = false, length = 2)
    @Builder.Default
    private String status = "";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marked_by",
            foreignKey = @ForeignKey(name = "fk_att_rec_marked_by"))
    private User markedBy;

    @Column(name = "check_in_time")
    private OffsetDateTime checkInTime;

    @Column(name = "check_out_time")
    private OffsetDateTime checkOutTime;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}